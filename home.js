function readAll_ans_saveded() {
    readAll_ans_saveded_new();
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

async function readAll_exam_saveded_new(action) {
    var teacher_email = localStorage.getItem('loginEmail');

    if (!teacher_email) {
        $('#exam_saved_te #exam_saved_forAdd').html('<tr><td colspan="3">الرجاء تسجيل الدخول لعرض اختباراتك المنشورة</td></tr>');
        return;
    }

    let { data, error } = await window._supabase
        .from('exams')
        .select('*')
        .eq('teacher_email', teacher_email)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching exams:', error.message);
        $('#exam_saved_te #exam_saved_forAdd').html('<tr><td colspan="3">خطأ في جلب الاختبارات من السحابة</td></tr>');
        return;
    }

    if (!data || data.length === 0) {
        $('#exam_saved_te #exam_saved_forAdd').html('<tr><td colspan="3">لم تقم بإنشاء أي اختبار حتى الآن</td></tr>');
        readAll_student_exams_sync([]);
        return;
    }

    syncTeacherExamsToStudentStorage(data);

    var html = '';
    data.forEach(exam => {
        html += `<tr>
            <td style="font-weight:800; text-align:right; padding-right:15px;">${exam.exam_name}</td>
            <td><code style="background:#e2e8f0; padding:3px 8px; border-radius:4px; font-weight:bold;">${exam.exam_number}</code></td>
            <td>
                <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">
                    <button class="desine-btn" style="padding:5px 8px; font-size:0.75rem; background:#10b981; margin:0;" onclick="viewExamResultsByNum(${exam.exam_number})" title="النتائج"><i class="fas fa-chart-bar"></i> النتائج</button>
                    <button class="desine-btn" style="padding:5px 8px; font-size:0.75rem; background:#0284c7; margin:0;" onclick="editThisExam(${exam.exam_number})" title="تعديل"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="desine-btn" style="padding:5px 8px; font-size:0.75rem; background:#ef4444; margin:0;" onclick="deleteThisExamByNum(${exam.exam_number})" title="حذف"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </td>
        </tr>`;
    });

    $('#exam_saved_te #exam_saved_forAdd').html(html);
    readAll_student_exams_sync(data);
}

function syncTeacherExamsToStudentStorage(teacherExams) {
    let savedExams = JSON.parse(localStorage.getItem('downloaded_exams') || '[]');
    
    teacherExams.forEach(tExam => {
        let exists = savedExams.some(e => e.exam_number == tExam.exam_number);
        if (!exists) {
            savedExams.push(tExam);
        } else {
            let index = savedExams.findIndex(e => e.exam_number == tExam.exam_number);
            if (index !== -1) {
                savedExams[index] = tExam;
            }
        }
    });
    localStorage.setItem('downloaded_exams', JSON.stringify(savedExams));
}

function readAll_student_exams_sync(teacherExamsData) {
    let savedExams = JSON.parse(localStorage.getItem('downloaded_exams') || '[]');
    
    if (savedExams.length === 0) {
        $('#exam_saved_st #ans_saved_forAdd').html('<tr><td colspan="3">لم تقم بحفظ أي اختبار للطالب محلياً حتى الآن</td></tr>');
        return;
    }

    var html = '';
    savedExams.forEach(exam => {
        let studentGrades = JSON.parse(localStorage.getItem('student_grades') || '{}');
        let myGradeBox = studentGrades[exam.exam_number] 
            ? `<div style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:6px; font-weight:bold; display:inline-block; margin-top:4px;">الدرجة: ${studentGrades[exam.exam_number]}</div>` 
            : `<div style="background:#f1f5f9; color:#64748b; padding:4px 10px; border-radius:6px; font-size:0.85rem; display:inline-block; margin-top:4px;">لم تختبر بعد</div>`;

        html += `<tr>
            <td style="text-align:right; padding-right:15px;"><b>${exam.exam_name}</b><br>${myGradeBox}</td>
            <td><code style="background:#e2e8f0; padding:3px 8px; border-radius:4px; font-weight:bold;">${exam.exam_number}</code></td>
            <td>
                <div style="display:flex; gap:5px; justify-content:center; flex-wrap:wrap;">
                    <button class="desine-btn" style="padding:6px 12px; font-size:0.85rem; background:#2563eb; margin:0;" onclick="startDownloadedExam(${exam.exam_number})">
                        <i class="fas fa-play"></i> فتح الاختبار
                    </button>
                </div>
            </td>
        </tr>`;
    });

    $('#exam_saved_st #ans_saved_forAdd').html(html);
}

function viewExamResultsByNum(examNum) {
    window.currentExamNumberForResults = examNum;
    go_page('page_result');
    load_exam_results(examNum);
}

function editThisExam(examNum) {
    window.editingExamNumber = examNum;
    $('#load').show();
    
    window._supabase
        .from('exams')
        .select('*')
        .eq('exam_number', examNum)
        .single()
        .then(({ data, error }) => {
            $('#load').hide();
            if (error || !data) {
                alert('تعذر تحميل بيانات الاختبار للتعديل');
                return;
            }
            $('#t_name').val(data.exam_name);
            $('#t_info').val(data.exam_info);
            $('#t_zoom_link').val(data.zoom_link || '');
            
            if (data.settings) {
                $('#Pass_start_ckeck').prop('checked', data.settings.pass_start_check || false);
                if(data.settings.pass_start_check) $('#input_Pass').show();
                $('#t_pass_start').val(data.settings.t_pass_start || '');
                $('#Time_test_ckeck').prop('checked', data.settings.time_test_check || false);
                if(data.settings.time_test_check) $('#input_Time').show();
                $('#Time_test').val(data.settings.time_test || '');
                $('#Bank_test_ckeck').prop('checked', data.settings.bank_test_check || false);
                if(data.settings.bank_test_check) $('#input_Bank').show();
                $('#Bank_test').val(data.settings.bank_test || '');
                $('#RandomAsk').prop('checked', data.settings.random_ask || false);
                $('#RandomAnswers').prop('checked', data.settings.random_answers || false);
            }
            
            $('#form_new_ask').html('');
            questionCount = 0;
            
            if (data.exam_data && data.exam_data.questions) {
                data.exam_data.questions.forEach(q => {
                    add_ask();
                    let currentBox = $('#form_new_ask .question_box').last();
                    currentBox.find('.inputAsk').val(q.question);
                    let ansInputs = currentBox.find('.inputAns');
                    if (q.options) {
                        q.options.forEach((opt, idx) => {
                            if (ansInputs[idx]) {
                                $(ansInputs[idx]).val(opt);
                            }
                        });
                    }
                });
            }
            go_page('page_newtest');
            $('#btnAddExam').text('تحديث وحفظ التعديلات');
        });
}

async function deleteThisExamByNum(examNum) {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار نهائياً من السحابة؟')) return;

    let { error } = await window._supabase
        .from('exams')
        .delete()
        .eq('exam_number', examNum);

    if (error) {
        alert('خطأ أثناء الحذف: ' + error.message);
    } else {
        alert('تم حذف الاختبار بنجاح');
        readAll_exam_saveded_new('update');
    }
}

function readAll_ans_saveded_new() {
    readAll_student_exams_sync([]);
}

function startDownloadedExam(exam_number) {
    let savedExams = JSON.parse(localStorage.getItem('downloaded_exams') || '[]');
    let exam = savedExams.find(e => e.exam_number == exam_number);
    if (!exam) {
        alert('الاختبار غير موجود محلياً');
        return;
    }

    // تفعيل قفل الاختبار بكلمة المرور
    if (exam.settings && exam.settings.pass_start_check === true && exam.settings.t_pass_start && exam.settings.t_pass_start.trim() !== '') {
        let enteredPass = prompt('هذا الاختبار محمي بكلمة مرور. الرجاء إدخال كلمة المرور للبدء:');
        if (enteredPass !== exam.settings.t_pass_start) {
            alert('كلمة المرور غير صحيحة!');
            return;
        }
    }

    window.currentActiveExam = exam;
    $('#show_numExam').text(exam.exam_number);
    $('#show_nameExam').text(exam.exam_name);
    $('#show_nobzaExam').text(exam.exam_info || 'لا توجد نبذة وصفية');

    if (window.examTimerInterval) clearInterval(window.examTimerInterval);
    if (exam.settings && exam.settings.time_test_check === true && exam.settings.time_test) {
        let totalMinutes = parseInt(exam.settings.time_test);
        if (totalMinutes > 0) {
            let timeLeft = totalMinutes * 60;
            $('#navTimeTest').removeClass('Dnone');
            
            window.examTimerInterval = setInterval(() => {
                let mins = Math.floor(timeLeft / 60);
                let secs = timeLeft % 60;
                $('#showTimeHere').text(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
                
                if (timeLeft <= 0) {
                    clearInterval(window.examTimerInterval);
                    alert('انتهى الوقت المحدد للاختبار!');
                    get_ans_data();
                }
                timeLeft--;
            }, 1000);
        } else {
            $('#navTimeTest').addClass('Dnone');
        }
    } else {
        $('#navTimeTest').addClass('Dnone');
    }

    let zoomBtnHtml = '';
    if (exam.zoom_link && exam.zoom_link.trim() !== '') {
        zoomBtnHtml = `<div style="text-align:center; margin-bottom:20px;">
            <a href="${exam.zoom_link}" target="_blank" class="desine-btn" style="background:#0284c7; text-decoration:none; display:inline-block; padding:12px 30px; font-size:1.05rem;">
                <i class="fas fa-video"></i> الانضمام إلى الحصة الافتراضية (Zoom / Meet)
            </a>
        </div>`;
    }

    var numbers = ['⓵', '⓶', '⓷', '⓸'];
    var qHtml = '';
    if (exam.exam_data && exam.exam_data.questions) {
        let allQuestions = [...exam.exam_data.questions];
        
        // تفعيل بنك الأسئلة (سحب عدد عشوائي لكل طالب)
        if (exam.settings && exam.settings.bank_test_check === true && exam.settings.bank_test) {
            let requiredCount = parseInt(exam.settings.bank_test);
            if (requiredCount > 0 && requiredCount < allQuestions.length) {
                allQuestions.sort(() => Math.random() - 0.5);
                allQuestions = allQuestions.slice(0, requiredCount);
            }
        }

        if (exam.settings && exam.settings.random_ask === true) {
            allQuestions.sort(() => Math.random() - 0.5);
        }

        window.currentActiveExamQuestionsList = allQuestions;

        allQuestions.forEach((q, qIndex) => {
            let optionsList = q.options ? [...q.options] : [];
            
            if (exam.settings && exam.settings.random_answers === true) {
                optionsList.sort(() => Math.random() - 0.5);
            }

            qHtml += `<div class="question_box" data-question-index="${qIndex}" style="background:#fff; padding:20px; margin:15px auto; width:95%; border-radius:12px; border:1.5px solid #e2e8f0; text-align:right;">
                <p style="font-weight:800; color:#1e293b; margin-bottom:5px;">السؤال رقم ${qIndex + 1}</p>
                <div style="width:100%; min-height:45px; padding:12px 14px; border-radius:8px; border:1.5px solid var(--border-color); background-color:#f8fafc; color:#0f172a; font-weight:750; margin-bottom:15px; white-space:pre-wrap; word-break:break-word;">${q.question || ''}</div>`;
            
            if (optionsList.length > 0) {
                optionsList.forEach((opt, oIndex) => {
                    if (opt) {
                        qHtml += `<label style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:10px 14px; margin:8px 0; border-radius:8px; border:1.5px solid #cbd5e1; cursor:pointer; font-weight:750;">
                            <div style="display:flex; align-items:center;">
                                <span style="font-size:1.1rem; margin-left:10px; font-weight:800; color:#4338ca;">${numbers[oIndex] || ''}</span>
                                <span>${opt}</span>
                            </div>
                            <input type="radio" name="q_${qIndex}" value="${opt}" style="width:18px; height:18px; cursor:pointer;">
                        </label>`;
                    }
                });
            } else {
                qHtml += `<input type="text" class="inputMyApp inputAns" placeholder="اكتب إجابتك هنا" style="text-align:right;">`;
            }
            qHtml += `</div>`;
        });
    }

    $('#add_ask_here').html(zoomBtnHtml + qHtml);
    go_page('page_mytest');
}

// ==================== الفصول الإلكترونية المتقدمة ====================
function goClassroomsPage() {
    go_page('page_classrooms');
    let isTeacher = localStorage.getItem('loginState') === 'login=OK';
    
    if (isTeacher) {
        $('#teacher_class_creation_box').removeClass('Dnone').show();
        $('#student_class_section').hide();
        loadTeacherClassrooms();
    } else {
        $('#teacher_class_creation_box').addClass('Dnone').hide();
        $('#student_class_section').show();
        loadStudentJoinedClasses();
    }
}

async function createNewClassroom() {
    var className = $('#cls_name').val();
    var teacherEmail = localStorage.getItem('loginEmail');

    if (!className) {
        alert('الرجاء إدخال اسم الفصل الدراسي');
        return;
    }
    if (!teacherEmail) {
        alert('الرجاء تسجيل الدخول أولاً');
        return;
    }

    var classCode = 'CLS-' + Math.floor(1000 + Math.random() * 9000);

    $('#load').show();
    let { data, error } = await window._supabase
        .from('classrooms')
        .insert([
            {
                teacher_email: String(teacherEmail),
                class_name: String(className),
                class_code: String(classCode)
            }
        ]);
    $('#load').hide();

    if (error) {
        alert('خطأ أثناء إنشاء الفصل: ' + error.message);
    } else {
        alert('تم إنشاء الفصل بنجاح! رمز الانضمام هو: ' + classCode);
        $('#cls_name').val('');
        loadTeacherClassrooms();
    }
}

// دالة مساعدة لاستخراج الرقم من رمز الفصل
function getClassNumber(classCode) {
    if (!classCode) return '';
    return classCode.replace('CLS-', '');
}

async function loadTeacherClassrooms() {
    var rawEmail = localStorage.getItem('loginEmail');
    if (!rawEmail) return;
    var teacherEmail = rawEmail.trim().toLowerCase();

    let { data, error } = await window._supabase
        .from('classrooms')
        .select('*')
        .ilike('teacher_email', teacherEmail)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching classrooms:', error);
        $('#classrooms_list_add').html('<tr><td colspan="3">خطأ في جلب الفصول: ' + error.message + '</td></tr>');
        return;
    }

    if (!data || data.length === 0) {
        $('#classrooms_list_add').html('<tr><td colspan="3">لا توجد فصول مضافة حتى الآن</td></tr>');
        return;
    }

    var html = '';
    data.forEach(cls => {
        var classNum = getClassNumber(cls.class_code);
        html += `<tr>
            <td style="font-weight:800; text-align:right; padding-right:15px;">${cls.class_name}</td>
            <td><code style="background:#dbeafe; color:#1e40af; padding:3px 8px; border-radius:4px; font-weight:bold;">${classNum}</code></td>
            <td>
                <div style="display:flex; gap:4px; justify-content:center;">
                    <button class="desine-btn" style="padding:5px 8px; font-size:0.75rem; background:#2563eb; margin:0;" onclick="manageSingleClassroom('${cls.class_code}', '${escapeHtml(cls.class_name)}')"><i class="fas fa-folder-open"></i> إدارة</button>
                    <button class="desine-btn" style="padding:5px 8px; font-size:0.75rem; background:#0284c7; margin:0;" onclick="manageClassroom('${cls.class_code}', '${escapeHtml(cls.class_name)}')"><i class="fas fa-users"></i> الطلاب</button>
                    <button class="desine-btn" style="padding:5px 8px; font-size:0.75rem; background:#ef4444; margin:0;" onclick="deleteClassroom(${cls.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    });

    $('#classrooms_list_add').html(html);
}

async function studentJoinClassroom() {
    var stdName = $('#student_join_name').val();
    var clsCode = 'CLS-' + $('#student_join_code').val().trim();

    if (!stdName || !$('#student_join_code').val().trim()) {
        alert('الرجاء إدخال اسمك ورمز الانضمام للفصل');
        return;
    }

    let { data: clsData, error: clsErr } = await window._supabase
        .from('classrooms')
        .select('*')
        .eq('class_code', clsCode)
        .single();

    if (clsErr || !clsData) {
        alert('رمز الفصل غير صحيح أو غير موجود.');
        return;
    }

    $('#load').show();
    let { error } = await window._supabase
        .from('classroom_students')
        .insert([
            {
                class_code: clsCode,
                student_name: stdName
            }
        ]);
    $('#load').hide();

    if (error) {
        if (error.code === '23505') {
            alert('أنت منضم بالفعل إلى هذا الفصل الدراسي.');
        } else {
            alert('خطأ أثناء الانضمام: ' + error.message);
        }
    } else {
        alert('تم الانضمام إلى الفصل بنجاح: ' + clsData.class_name);
        $('#student_join_code').val('');
        manageSingleClassroom(clsData.class_code, clsData.class_name);
    }
}

async function loadStudentJoinedClasses() {
    let { data, error } = await window._supabase
        .from('classrooms')
        .select('*')
        .order('id', { ascending: false });

    if (error || !data || data.length === 0) {
        $('#classrooms_list_add').html('<tr><td colspan="3">لا توجد فصول متاحة حالياً</td></tr>');
        return;
    }

    var html = '';
    data.forEach(cls => {
        var classNum = getClassNumber(cls.class_code);
        html += `<tr>
            <td style="font-weight:800; text-align:right; padding-right:15px;">${cls.class_name}</td>
            <td><code style="background:#dbeafe; color:#1e40af; padding:3px 8px; border-radius:4px; font-weight:bold;">${classNum}</code></td>
            <td>
                <button class="desine-btn" style="padding:5px 12px; font-size:0.8rem; background:#10b981; margin:0;" onclick="manageSingleClassroom('${cls.class_code}', '${escapeHtml(cls.class_name)}')"><i class="fas fa-door-open"></i> فتح الفصل</button>
            </td>
        </tr>`;
    });

    $('#classrooms_list_add').html(html);
}

async function manageSingleClassroom(code, name) {
    go_page('page_classroom_single');
    $('#single_cls_title').text('إدارة فصل: ' + name);
    $('#single_cls_code').text(code);
    window.currentManagingClassCode = code;

    let isTeacher = (localStorage.getItem('loginState') === 'login=OK');
    if (isTeacher) {
        $('#teacher_add_exam_to_cls_box').show();
        $('#teacher_add_content_box').show();
        $('#students_section_container').show(); // إظهار قسم الطلاب للمعلم
    } else {
        $('#teacher_add_exam_to_cls_box').hide();
        $('#teacher_add_content_box').hide();
        $('#students_section_container').hide(); // إخفاء قسم الطلاب عن الطالب
    }

    loadSingleClassroomExams(code);
    loadSingleClassroomContents(code);
    loadSingleClassroomStudents(code);
}

async function loadSingleClassroomExams(code) {
    $('#single_cls_exams_container').html('جاري تحميل الاختبارات...');
    let { data, error } = await window._supabase
        .from('classroom_exams')
        .select('*')
        .eq('class_code', code);

    if (error || !data || data.length === 0) {
        $('#single_cls_exams_container').html('<p style="color:#64748b;">لا توجد اختبارات مرتبطة بهذا الفصل.</p>');
        return;
    }

    let html = '<ul style="list-style:none; padding:0; text-align:right; display:flex; flex-direction:column; gap:12px;">';
    data.forEach(ex => {
        html += `<li style="background:#ffffff; border:1.5px solid #e2e8f0; padding:0; margin:0; border-radius:14px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06); transition:all 0.2s ease;">
            
            <!-- الجزء العلوي: معلومات الاختبار -->
            <div style="padding:16px 18px 12px 18px; background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-bottom:1px solid #e2e8f0;">
                
                <!-- عنوان الاختبار -->
                <h5 style="margin:0 0 10px 0; color:#1e293b; font-size:1rem; font-weight:800; line-height:1.5; word-break:break-word; overflow-wrap:break-word; text-align:right;">
                    <i class="fas fa-file-alt" style="color:#3b82f6; margin-left:8px;"></i>${ex.exam_name}
                </h5>
                
                <!-- رقم الاختبار -->
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span style="color:#64748b; font-size:0.8rem; font-weight:600;">رقم الاختبار:</span>
                    <code style="background:#dbeafe; color:#1e40af; padding:4px 12px; border-radius:6px; font-size:0.85rem; font-weight:800; letter-spacing:0.5px; border:1px solid #bfdbfe;">${ex.exam_number}</code>
                </div>
                
            </div>
            
            <!-- الجزء السفلي: زر الفتح -->
            <div style="padding:14px 18px; background:#ffffff; display:flex; justify-content:flex-end; align-items:center;">
                <button class="desine-btn" style="padding:12px 24px; font-size:0.9rem; background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); margin:0; border-radius:10px; min-width:140px; text-align:center; font-weight:800; border:none; box-shadow:0 4px 12px rgba(37,99,235,0.3); color:#fff; cursor:pointer; transition:all 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(37,99,235,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(37,99,235,0.3)'" onclick="searchAndStartExamByNum(${ex.exam_number})">
                    <i class="fas fa-play-circle" style="margin-left:6px;"></i> فتح الاختبار
                </button>
            </div>
            
        </li>`;
    });
    html += '</ul>';
    $('#single_cls_exams_container').html(html);
}

async function publishExamToSingleClass() {
    let examNum = $('#single_link_exam_num').val();
    let code = window.currentManagingClassCode;

    if (!examNum) {
        alert('الرجاء إدخال رقم الاختبار');
        return;
    }

    let { data: examData, error: examErr } = await window._supabase
        .from('exams')
        .select('*')
        .eq('exam_number', Number(examNum))
        .single();

    if (examErr || !examData) {
        alert('رقم الاختبار غير موجود في السحابة.');
        return;
    }

    let { error } = await window._supabase
        .from('classroom_exams')
        .insert([
            {
                class_code: code,
                exam_number: Number(examNum),
                exam_name: String(examData.exam_name)
            }
        ]);

    if (error) {
        if (error.code === '23505') {
            alert('هذا الاختبار منشور مسبقاً في هذا الفصل.');
        } else {
            alert('خطأ أثناء ربط الاختبار: ' + error.message);
        }
    } else {
        alert('تم نشر الاختبار في الفصل بنجاح!');
        $('#single_link_exam_num').val('');
        loadSingleClassroomExams(code);
    }
}

async function removeExamFromClass(relId, code) {
    if (!confirm('هل تريد إزالة هذا الاختبار من الفصل؟')) return;
    let { error } = await window._supabase.from('classroom_exams').delete().eq('id', relId);
    if (!error) loadSingleClassroomExams(code);
}

// ===== دالة عرض المحتوى (تم تعديل التنسيق فقط) =====
async function loadSingleClassroomContents(code) {
    let { data } = await window._supabase
        .from('classroom_contents')
        .select('*')
        .eq('class_code', code)
        .order('id', { ascending: false });

    if (!data || data.length === 0) {
        $('#single_cls_content_container').html('<p style="color:#64748b; text-align:center; padding:20px; background:#f8fafc; border-radius:10px; border:1px dashed #cbd5e1;">لا توجد محتويات أو إعلانات منشورة بعد.</p>');
        return;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:16px;">';

    data.forEach(item => {
        let badgeColor = item.content_type === 'homework' ? '#dc2626' : item.content_type === 'link' ? '#0284c7' : '#4338ca';
        let badgeName = item.content_type === 'homework' ? '📝 واجب دراسي' : item.content_type === 'link' ? '🔗 رابط خارجي' : '📢 إعلان وشرح';
        let icon = item.content_type === 'homework' ? 'fa-tasks' : item.content_type === 'link' ? 'fa-link' : 'fa-bullhorn';

        let bodyContent = '';
        if (item.body && (item.body.startsWith('http://') || item.body.startsWith('https://'))) {
            bodyContent = `
                <div style="margin-top:12px; text-align:center;">
                    <a href="${item.body}" target="_blank" class="desine-btn" style="background:#0284c7; display:inline-block; padding:10px 35px; text-decoration:none; border-radius:10px; font-weight:800; font-size:0.95rem; box-shadow:0 4px 12px rgba(2,132,199,0.3); transition:0.2s;">
                        <i class="fas fa-external-link-alt"></i> فتح الرابط
                    </a>
                </div>
            `;
        } else {
            bodyContent = `<p style="margin:8px 0 0 0; white-space:pre-wrap; color:#334155; font-weight:600; line-height:1.8; font-size:0.95rem;">${item.body}</p>`;
        }

        html += `
            <div style="background:#ffffff; border-radius:14px; border:1.5px solid #e2e8f0; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); transition:all 0.2s ease;">
                
                <!-- رأس البطاقة: نوع المحتوى -->
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px; background:linear-gradient(135deg, ${badgeColor}15 0%, ${badgeColor}08 100%); border-bottom:1px solid #e2e8f0;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="background:${badgeColor}; color:#fff; padding:4px 14px; border-radius:20px; font-size:0.75rem; font-weight:800; letter-spacing:0.3px;">
                            <i class="fas ${icon}"></i> ${badgeName}
                        </span>
                    </div>
                </div>
                
                <!-- جسم البطاقة: العنوان + المحتوى -->
                <div style="padding:16px 20px 20px 20px;">
                    <h5 style="margin:0 0 6px 0; color:#1e293b; font-size:1.05rem; font-weight:800; text-align:right;">
                        <i class="fas fa-tag" style="color:#64748b; margin-left:8px; font-size:0.85rem;"></i>
                        ${item.title}
                    </h5>
                    ${bodyContent}
                </div>
                
            </div>
        `;
    });

    html += '</div>';
    $('#single_cls_content_container').html(html);
}

async function publishContentToClass() {
    let title = $('#cls_content_title').val();
    let body = $('#cls_content_body').val();
    let code = window.currentManagingClassCode;

    if (!title || !body) {
        alert('الرجاء إدخال عنوان ومحتوى الإعلان أو الواجب');
        return;
    }

    let { error } = await window._supabase
        .from('classroom_contents')
        .insert([{ class_code: code, title: title, body: body }]);

    if (error) {
        alert('خطأ أثناء النشر: ' + error.message);
    } else {
        alert('تم نشر المحتوى بنجاح لجميع طلاب الفصل!');
        $('#cls_content_title').val('');
        $('#cls_content_body').val('');
        loadSingleClassroomContents(code);
    }
}

async function loadSingleClassroomStudents(code) {
    let { data } = await window._supabase
        .from('classroom_students')
        .select('*')
        .eq('class_code', code);

    if (!data || data.length === 0) {
        $('#single_cls_students_list').html('<p style="color:#64748b; margin:0;">لا يوجد طلاب منضمين حتى الآن.</p>');
        return;
    }

    let html = '<ul style="margin:0; padding-right:20px; text-align:right;">';
    data.forEach((s, idx) => {
        html += `<li><b>${idx + 1}. ${s.student_name}</b></li>`;
    });
    html += '</ul>';
    $('#single_cls_students_list').html(html);
}

async function searchAndStartExamByNum(examNum) {
    $('#load').show();
    let { data, error } = await window._supabase
        .from('exams')
        .select('*')
        .eq('exam_number', Number(examNum))
        .single();
    $('#load').hide();

    if (error || !data) {
        alert('تعذر فتح الاختبار');
        return;
    }

    window.currentLoadedExam = data;
    downloadExam_new();
}

async function deleteClassroom(clsId) {
    if (!confirm('هل أنت متأكد من حذف هذا الفصل الدراسي؟')) return;

    let { error } = await window._supabase
        .from('classrooms')
        .delete()
        .eq('id', clsId);

    if (error) {
        alert('خطأ أثناء الحذف: ' + error.message);
    } else {
        alert('تم حذف الفصل بنجاح');
        loadTeacherClassrooms();
    }
}

function teacherLogout() {
    if (!confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من وضع المعلم؟')) return;

    localStorage.removeItem('loginState');
    localStorage.removeItem('loginEmail');
    localStorage.removeItem('teacher_pass_hash');
    window.loginState = '';
    window.loginEmail = '';

    $('#loginEmail').text('');
    $('#logout_btn').hide();
    
    alert('تم تسجيل الخروج بنجاح.');
    go_page('page_home');
}

$(document).ready(function() {
    readAll_ans_saveded_new();
    if (localStorage.getItem('loginState') === 'login=OK') {
        window.loginState = 'login=OK';
        window.loginEmail = localStorage.getItem('loginEmail');
        $('#loginEmail').text('مرحباً بك: ' + window.loginEmail);
        $('#logout_btn').show();
        readAll_exam_saveded_new();
    } else {
        $('#logout_btn').hide();
        readAll_student_exams_sync([]);
    }
});
