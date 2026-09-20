function readAll_ans_saveded() {
    readAll_ans_saveded_new();
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function getClassNumber(classCode) {
    if (!classCode) return '';
    return classCode.replace('CLS-', '');
}

// ==================== دوال المعلم ====================
async function readAll_exam_saveded_new(action) {
    var teacher_email = localStorage.getItem('loginEmail');

    if (!teacher_email) {
        $('#exam_saved_te #exam_saved_forAdd').html('<div style="text-align:center; padding:30px; color:var(--text-muted);">الرجاء تسجيل الدخول لعرض اختباراتك المنشورة</div>');
        return;
    }

    let { data, error } = await window._supabase
        .from('exams')
        .select('*')
        .eq('teacher_email', teacher_email)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching exams:', error.message);
        $('#exam_saved_te #exam_saved_forAdd').html('<div style="text-align:center; padding:30px; color:var(--danger);">خطأ في جلب الاختبارات من السحابة</div>');
        return;
    }

    if (!data || data.length === 0) {
        $('#exam_saved_te #exam_saved_forAdd').html('<div style="text-align:center; padding:30px; color:var(--text-muted);">لم تقم بإنشاء أي اختبار حتى الآن</div>');
        readAll_student_exams_sync([]);
        return;
    }

    syncTeacherExamsToStudentStorage(data);

    var html = '<div class="classroom-grid" style="max-width:750px; margin:0 auto;">';
    data.forEach(exam => {
        html += `
            <div class="classroom-card" style="text-align:center;">
                <div class="cls-name" style="font-size:1.2rem; font-weight:900; color:#0f172a; margin-bottom:6px;">${exam.exam_name}</div>
                <div class="cls-code" style="display:inline-block; background:#eef2ff; color:#4f46e5; padding:4px 18px; border-radius:30px; font-weight:800; font-size:0.9rem; border:1px solid #c7d2fe; letter-spacing:0.5px; margin-bottom:12px;">
                    رقم الاختبار: ${exam.exam_number} 
                    <span class="copy-icon" onclick="event.stopPropagation(); copyToClipboard('${exam.exam_number}')" title="نسخ رقم الاختبار">📋 نسخ</span>
                </div>
                <div class="cls-actions" style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
                    <button class="desine-btn" style="background:#10b981; padding:6px 16px; font-size:0.8rem; border-radius:30px; margin:0;" onclick="viewExamResultsByNum(${exam.exam_number})" title="النتائج"><i class="fas fa-chart-bar"></i> النتائج</button>
                    <button class="desine-btn" style="background:#0284c7; padding:6px 16px; font-size:0.8rem; border-radius:30px; margin:0;" onclick="editThisExam(${exam.exam_number})" title="تعديل"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="desine-btn" style="background:#ef4444; padding:6px 16px; font-size:0.8rem; border-radius:30px; margin:0;" onclick="deleteThisExamByNum(${exam.exam_number})" title="حذف"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>
        `;
    });
    html += '</div>';

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

// ==================== عرض الاختبارات المحفوظة كبطاقات ====================
function readAll_student_exams_sync(teacherExamsData) {
    let savedExams = JSON.parse(localStorage.getItem('downloaded_exams') || '[]');
    
    if (savedExams.length === 0) {
        $('#exam_loaded_forAdd').html('<div style="text-align:center; padding:20px; color:var(--text-muted); background:#fff; border-radius:12px; border:1.5px dashed var(--border-color);">لم تقم بحفظ أي اختبار محلياً حتى الآن</div>');
        return;
    }

    let sortedExams = [...savedExams].sort((a, b) => {
        let grades = JSON.parse(localStorage.getItem('student_grades') || '{}');
        let aData = grades[a.exam_number];
        let bData = grades[b.exam_number];
        
        let aTested = aData && (Array.isArray(aData) ? aData.length > 0 : true);
        let bTested = bData && (Array.isArray(bData) ? bData.length > 0 : true);
        
        if (aTested && !bTested) return -1;
        if (!aTested && bTested) return 1;
        return b.exam_number - a.exam_number;
    });

    var html = '<div class="classroom-grid" style="max-width:750px; margin:0 auto;">';
    
    sortedExams.forEach(exam => {
        let studentGrades = JSON.parse(localStorage.getItem('student_grades') || '{}');
        let gradesData = studentGrades[exam.exam_number];
        
        let gradeInfoHtml = '';
        let isTested = false;
        let attemptsCount = 0;
        
        if (Array.isArray(gradesData) && gradesData.length > 0) {
            isTested = true;
            attemptsCount = gradesData.length;
            
            let bestAttempt = gradesData.reduce((best, curr) => {
                let bestPct = (best.total && best.total > 0) ? (best.obtained / best.total) : 0;
                let currPct = (curr.total && curr.total > 0) ? (curr.obtained / curr.total) : 0;
                return currPct > bestPct ? curr : best;
            }, gradesData[0]);
            
            gradeInfoHtml = `
                <div style="background:#dcfce7; color:#166534; padding:6px 12px; border-radius:8px; font-weight:800; display:inline-block; margin-top:8px; font-size:0.9rem;">
                    <i class="fas fa-trophy"></i> أفضل درجة: ${bestAttempt.grade}
                </div>
                <div style="background:#dbeafe; color:#1e40af; padding:4px 10px; border-radius:8px; font-size:0.8rem; display:inline-block; margin-top:6px; margin-right:5px;">
                    ${attemptsCount} محاولة
                </div>
            `;
        } else if (gradesData && typeof gradesData === 'string') {
            isTested = true;
            attemptsCount = 1;
            gradeInfoHtml = `
                <div style="background:#dcfce7; color:#166534; padding:6px 12px; border-radius:8px; font-weight:800; display:inline-block; margin-top:8px; font-size:0.9rem;">
                    <i class="fas fa-check"></i> الدرجة: ${gradesData}
                </div>
            `;
        } else {
            gradeInfoHtml = `
                <div style="background:#f1f5f9; color:#64748b; padding:6px 12px; border-radius:8px; font-weight:700; display:inline-block; margin-top:8px; font-size:0.85rem;">
                    <i class="fas fa-clock"></i> لم تختبر بعد
                </div>
            `;
        }

        let actionButtons = '';
        if (isTested) {
            actionButtons = `
                <button class="desine-btn" style="background:#2563eb; padding:6px 14px; font-size:0.75rem; border-radius:30px; margin:0;" onclick="startDownloadedExam(${exam.exam_number})">
                    <i class="fas fa-redo"></i> إعادة
                </button>
                <button class="desine-btn" style="background:#8b5cf6; padding:6px 14px; font-size:0.75rem; border-radius:30px; margin:0;" onclick="reviewExam(${exam.exam_number})">
                    <i class="fas fa-eye"></i> مراجعة
                </button>
                <button class="desine-btn" style="background:#0284c7; padding:6px 14px; font-size:0.75rem; border-radius:30px; margin:0;" onclick="viewAllAttempts(${exam.exam_number})">
                    <i class="fas fa-list"></i> المحاولات
                </button>
                <button class="desine-btn" style="background:#ef4444; padding:6px 14px; font-size:0.75rem; border-radius:30px; margin:0;" onclick="deleteSavedExam(${exam.exam_number})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            `;
        } else {
            actionButtons = `
                <button class="desine-btn" style="background:#10b981; padding:6px 14px; font-size:0.75rem; border-radius:30px; margin:0;" onclick="startDownloadedExam(${exam.exam_number})">
                    <i class="fas fa-play"></i> فتح الاختبار
                </button>
                <button class="desine-btn" style="background:#ef4444; padding:6px 14px; font-size:0.75rem; border-radius:30px; margin:0;" onclick="deleteSavedExam(${exam.exam_number})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            `;
        }

        html += `
            <div class="classroom-card" style="text-align:center;">
                <div class="cls-name" style="font-size:1.1rem; font-weight:900; color:#0f172a; margin-bottom:6px;">${exam.exam_name}</div>
                <div class="cls-code" style="display:inline-block; background:#eef2ff; color:#4f46e5; padding:4px 18px; border-radius:30px; font-weight:800; font-size:0.85rem; border:1px solid #c7d2fe; letter-spacing:0.5px;">
                    رقم الاختبار: ${exam.exam_number}
                </div>
                <div style="margin-top:8px;">
                    ${gradeInfoHtml}
                </div>
                <div class="cls-actions" style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:14px;">
                    ${actionButtons}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    $('#exam_loaded_forAdd').html(html);
}

// ==================== تحديث جميع الاختبارات من السحابة ====================
async function updateAllSavedExamsFromCloud() {
    let savedExams = JSON.parse(localStorage.getItem('downloaded_exams') || '[]');
    
    if (savedExams.length === 0) {
        alert('لا توجد اختبارات محفوظة للتحديث');
        return;
    }
    
    if (!confirm('سيتم تحديث ' + savedExams.length + ' اختبار من السحابة.\n(لن تُحذف نتائجك أو محاولاتك السابقة)\n\nهل تريد المتابعة؟')) {
        return;
    }
    
    $('#load').show();
    
    let updatedCount = 0;
    let failedCount = 0;
    let failedExams = [];
    
    for (let i = 0; i < savedExams.length; i++) {
        try {
            let { data, error } = await window._supabase
                .from('exams')
                .select('*')
                .eq('exam_number', Number(savedExams[i].exam_number))
                .single();
            
            if (!error && data) {
                savedExams[i] = {
                    ...savedExams[i],
                    exam_name: data.exam_name,
                    exam_info: data.exam_info,
                    zoom_link: data.zoom_link,
                    exam_data: data.exam_data,
                    settings: data.settings,
                    teacher_email: data.teacher_email
                };
                updatedCount++;
            } else {
                failedCount++;
                failedExams.push(savedExams[i].exam_number);
            }
        } catch (e) {
            failedCount++;
            failedExams.push(savedExams[i].exam_number);
        }
    }
    
    localStorage.setItem('downloaded_exams', JSON.stringify(savedExams));
    $('#load').hide();
    
    let msg = '✅ تم تحديث ' + updatedCount + ' اختبار بنجاح.';
    if (failedCount > 0) {
        msg += '\n\n⚠️ فشل تحديث ' + failedCount + ' اختبار:';
        msg += '\n' + failedExams.join(', ');
        msg += '\n\n(قد تكون هذه الاختبارات محذوفة من السحابة)';
    }
    alert(msg);
    
    readAll_student_exams_sync();
}

// ==================== تحديث جميع الفصول من السحابة ====================
async function updateAllJoinedClassesFromCloud() {
    $('#load').show();
    
    try {
        let { data: allClasses, error } = await window._supabase
            .from('classrooms')
            .select('*')
            .order('id', { ascending: false });
        
        if (error || !allClasses) {
            $('#load').hide();
            alert('❌ تعذر جلب الفصول من السحابة');
            return;
        }
        
        let studentName = localStorage.getItem('studentName');
        if (!studentName) {
            $('#load').hide();
            alert('⚠️ الرجاء إدخال اسمك أولاً');
            return;
        }
        
        let { data: myClasses, error: joinError } = await window._supabase
            .from('classroom_students')
            .select('class_code')
            .eq('student_name', studentName);
        
        $('#load').hide();
        
        if (joinError) {
            alert('❌ تعذر جلب قائمة انضماماتك');
            return;
        }
        
        const joinedCodes = myClasses.map(item => item.class_code);
        const joinedClasses = allClasses.filter(cls => joinedCodes.includes(cls.class_code));
        
        renderJoinedClasses(joinedClasses);
        
        alert('✅ تم تحديث الفصول من السحابة بنجاح\nعدد الفصول المنضم إليها: ' + joinedClasses.length);
    } catch (e) {
        $('#load').hide();
        alert('❌ حدث خطأ: ' + e.message);
    }
}

// ==================== حذف اختبار محفوظ ====================
function deleteSavedExam(exam_number) {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار من قائمتك المحلية؟\n(سيتم حذف نتيجتك وإجاباتك المحلية لهذا الاختبار فقط)')) return;
    
    let savedExams = JSON.parse(localStorage.getItem('downloaded_exams') || '[]');
    savedExams = savedExams.filter(e => e.exam_number != exam_number);
    localStorage.setItem('downloaded_exams', JSON.stringify(savedExams));
    
    let studentGrades = JSON.parse(localStorage.getItem('student_grades') || '{}');
    delete studentGrades[exam_number];
    localStorage.setItem('student_grades', JSON.stringify(studentGrades));
    
    let studentSubmissions = JSON.parse(localStorage.getItem('student_submissions') || '{}');
    delete studentSubmissions[exam_number];
    localStorage.setItem('student_submissions', JSON.stringify(studentSubmissions));
    
    let attemptsKey = 'exam_attempt_count_' + exam_number;
    localStorage.removeItem(attemptsKey);
    
    let finishedExams = JSON.parse(localStorage.getItem('finished_exams') || '[]');
    finishedExams = finishedExams.filter(num => String(num) !== String(exam_number));
    localStorage.setItem('finished_exams', JSON.stringify(finishedExams));
    
    alert('✅ تم حذف الاختبار من قائمتك المحلية بنجاح');
    readAll_student_exams_sync();
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
                    if (q.correctIndex !== undefined) {
                        let radios = currentBox.find('input[type="radio"]');
                        if (radios[q.correctIndex]) {
                            radios.prop('checked', false);
                            $(radios[q.correctIndex]).prop('checked', true);
                        }
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
            
            let initMins = Math.floor(timeLeft / 60);
            let initSecs = timeLeft % 60;
            $('#showTimeHere').text(`${initMins}:${initSecs < 10 ? '0' : ''}${initSecs}`);
            
            window.examTimerInterval = setInterval(() => {
                let mins = Math.floor(timeLeft / 60);
                let secs = timeLeft % 60;
                $('#showTimeHere').text(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
                
                if (timeLeft <= 0) {
                    clearInterval(window.examTimerInterval);
                    if (!$('#shows_name').val()) {
                        $('#shows_name').val('طالب غير محدد');
                    }
                    alert('انتهى الوقت المحدد للاختبار! سيتم تسليم إجاباتك تلقائياً.\nالإجابات الفارغة ستُعتبر خاطئة.');
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

    var numbers = ['❶', '❷', '❸', '❹'];
    var qHtml = '';
    if (exam.exam_data && exam.exam_data.questions) {
        let allQuestions = [...exam.exam_data.questions];
        
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

        let processedQuestions = allQuestions.map(q => {
            let qCopy = {
                question: q.question,
                options: q.options ? [...q.options] : [],
                correctIndex: (q.correctIndex !== undefined) ? q.correctIndex : 0
            };
            
            if (exam.settings && exam.settings.random_answers === true) {
                let correctAnswerText = qCopy.options[qCopy.correctIndex];
                qCopy.options = [...qCopy.options].sort(() => Math.random() - 0.5);
                let newIndex = qCopy.options.indexOf(correctAnswerText);
                qCopy.correctIndex = newIndex >= 0 ? newIndex : 0;
            }
            
            return qCopy;
        });

        window.currentActiveExamQuestionsList = processedQuestions;

        processedQuestions.forEach((q, qIndex) => {
            let optionsList = q.options || [];
            
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
                            <input type="radio" name="q_${qIndex}" value="${escapeHtml(opt)}" style="width:18px; height:18px; cursor:pointer;">
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

// ===== دالة مساعدة: توحيد بيانات المحاولات =====
function normalizeSubmissionData(data) {
    if (!data) return null;
    
    if (Array.isArray(data)) {
        if (data.length === 0) return null;
        let last = data[data.length - 1];
        if (last && last.answers) {
            return { 
                answers: last.answers, 
                questions: last.questions || null, 
                isLegacy: !last.questions 
            };
        }
        return { answers: last, questions: null, isLegacy: true };
    }
    
    if (typeof data === 'object') {
        return { answers: data, questions: null, isLegacy: true };
    }
    
    return null;
}

// ===== مراجعة الاختبار =====
function reviewExam(exam_number) {
    let savedExams = JSON.parse(localStorage.getItem('downloaded_exams') || '[]');
    let exam = savedExams.find(e => e.exam_number == exam_number);
    if (!exam) {
        alert('الاختبار غير موجود محلياً');
        return;
    }

    let studentSubmissions = JSON.parse(localStorage.getItem('student_submissions') || '{}');
    let submissionsData = studentSubmissions[exam_number];
    
    let normalized = normalizeSubmissionData(submissionsData);
    
    if (!normalized) {
        alert('لا توجد إجابات مسجلة لهذا الاختبار للمراجعة');
        return;
    }
    
    let myAnswers = normalized.answers;
    let activeQuestions;

    if (normalized.questions && normalized.questions.length > 0) {
        activeQuestions = normalized.questions;
    } else {
        let answerCount = Object.keys(myAnswers).length;
        let allExamQuestions = (exam.exam_data && exam.exam_data.questions) || [];
        activeQuestions = allExamQuestions.slice(0, answerCount);
        
        if (answerCount > 0) {
            console.info('ملاحظة: هذه محاولة قديمة، تم اقتصاص الأسئلة إلى ' + answerCount + ' سؤال.');
        }
    }

    let studentGrades = JSON.parse(localStorage.getItem('student_grades') || '{}');
    let gradesData = studentGrades[exam_number];
    let gradeText = '0 / 0';
    
    if (Array.isArray(gradesData) && gradesData.length > 0) {
        gradeText = gradesData[gradesData.length - 1].grade;
    } else if (typeof gradesData === 'string') {
        gradeText = gradesData;
    }

    if (typeof openStudentFullReviewAfterSubmit === 'function') {
        openStudentFullReviewAfterSubmit(gradeText, exam_number, myAnswers, activeQuestions);
    }
}

// ===== سجل المحاولات =====
function viewAllAttempts(exam_number) {
    let studentGrades = JSON.parse(localStorage.getItem('student_grades') || '{}');
    let gradesData = studentGrades[exam_number];
    
    if (gradesData && typeof gradesData === 'string') {
        gradesData = [{
            grade: gradesData,
            obtained: 0,
            total: 0,
            date: null,
            attempt: 1
        }];
    }
    
    if (!Array.isArray(gradesData) || gradesData.length === 0) {
        alert('لا توجد محاولات مسجلة لهذا الاختبار');
        return;
    }
    
    let sortedAttempts = [...gradesData].sort((a, b) => (a.attempt || 0) - (b.attempt || 0));
    
    let html = `<div id="attempts_modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;">
        <div style="background:#fff;padding:25px;border-radius:16px;width:92%;max-width:550px;max-height:85vh;overflow-y:auto;text-align:right;box-shadow:0 25px 50px rgba(0,0,0,0.3);">
            <h3 style="color:var(--primary);text-align:center;margin-top:0;"><i class="fas fa-history"></i> سجل المحاولات</h3>
            <p style="color:#64748b;text-align:center;font-size:0.9rem;">عدد المحاولات: ${sortedAttempts.length}</p>
            <hr>
            <table style="width:100%;border:none;box-shadow:none;margin:0;">
                <thead>
                    <tr>
                        <th style="background:#f1f5f9;padding:8px;font-size:0.85rem;">المحاولة</th>
                        <th style="background:#f1f5f9;padding:8px;font-size:0.85rem;">الدرجة</th>
                        <th style="background:#f1f5f9;padding:8px;font-size:0.85rem;">التاريخ</th>
                    </tr>
                </thead>
                <tbody>`;
    
    let bestPct = -1;
    sortedAttempts.forEach(a => {
        let pct = (a.total && a.total > 0) ? (a.obtained / a.total) : 0;
        if (pct > bestPct) bestPct = pct;
    });
    
    sortedAttempts.forEach((attempt, idx) => {
        let dateStr = (attempt.date && typeof attempt.date === 'string') 
            ? new Date(attempt.date).toLocaleString('ar-SA') 
            : 'محاولة قديمة';
        let attemptNum = attempt.attempt || (idx + 1);
        let thisPct = (attempt.total && attempt.total > 0) ? (attempt.obtained / attempt.total) : 0;
        let isBest = (attempt.total > 0) && (thisPct === bestPct);
        
        html += `<tr>
            <td style="padding:8px;text-align:center;">${isBest ? '🏆 ' : ''}${attemptNum}</td>
            <td style="padding:8px;text-align:center;"><b style="color:#0284c7;">${attempt.grade}</b></td>
            <td style="padding:8px;text-align:center;font-size:0.8rem;color:#64748b;">${dateStr}</td>
        </tr>`;
    });
    
    html += `</tbody></table>
            <br>
            <button class="desine-btn" style="width:100%;background:#64748b;padding:12px;margin-top:15px;" onclick="$('#attempts_modal').remove()">إغلاق</button>
        </div>
    </div>`;
    
    $('#attempts_modal').remove();
    $('body').append(html);
}

// ==================== الفصول الإلكترونية ====================
function goClassroomsPage() {
    go_page('page_classrooms');
    $('#teacher_class_creation_box').addClass('Dnone').hide();
    $('#student_class_section').show();
    loadStudentJoinedClasses();
}

async function studentJoinClassroom() {
    var stdName = $('#student_join_name').val();
    var clsCode = $('#student_join_code').val().trim();

    if (!stdName || !clsCode) {
        alert('الرجاء إدخال اسمك ورمز الانضمام للفصل');
        return;
    }

    if (!clsCode.startsWith('CLS-')) {
        clsCode = 'CLS-' + clsCode;
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
        $('#student_join_name').val('');
        localStorage.setItem('studentName', stdName);
        manageSingleClassroom(clsData.class_code, clsData.class_name);
    }
}

async function insideJoinClassroom() {
    var stdName = $('#inside_join_name').val();
    var clsCode = window.currentManagingClassCode;

    if (!stdName) {
        alert('الرجاء إدخال اسمك');
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

    let { data: existing } = await window._supabase
        .from('classroom_students')
        .select('*')
        .eq('class_code', clsCode)
        .eq('student_name', stdName)
        .maybeSingle();

    if (existing) {
        alert('أنت منضم بالفعل إلى هذا الفصل.');
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
        alert('خطأ أثناء الانضمام: ' + error.message);
    } else {
        alert('تم الانضمام إلى الفصل بنجاح!');
        $('#inside_join_name').val('');
        $('#inside_join_section').hide();
        localStorage.setItem('studentName', stdName);
        loadSingleClassroomStudents(clsCode);
    }
}

async function loadStudentJoinedClasses() {
    let { data: allClasses, error } = await window._supabase
        .from('classrooms')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        $('#classrooms_list_add').html('<div style="text-align:center; padding:20px; color:var(--danger);">خطأ في جلب الفصول</div>');
        return;
    }

    if (!allClasses || allClasses.length === 0) {
        $('#classrooms_list_add').html('<div style="text-align:center; padding:20px; color:var(--text-muted);">لا توجد فصول متاحة حالياً</div>');
        return;
    }

    var studentName = localStorage.getItem('studentName');
    if (!studentName) {
        studentName = prompt('الرجاء إدخال اسمك الثلاثي لعرض الفصول التي انضممت إليها:');
        if (studentName) {
            localStorage.setItem('studentName', studentName);
        } else {
            $('#classrooms_list_add').html('<div style="text-align:center; padding:20px; color:var(--text-muted);">الرجاء إدخال اسمك لعرض الفصول.</div>');
            return;
        }
    }

    let { data: myClasses, error: joinError } = await window._supabase
        .from('classroom_students')
        .select('class_code')
        .eq('student_name', studentName);

    if (joinError) {
        $('#classrooms_list_add').html('<div style="text-align:center; padding:20px; color:var(--danger);">خطأ في جلب انضماماتك</div>');
        return;
    }

    const joinedCodes = myClasses.map(item => item.class_code);
    const joinedClasses = allClasses.filter(cls => joinedCodes.includes(cls.class_code));

    renderJoinedClasses(joinedClasses);
}

function renderJoinedClasses(joinedClasses) {
    if (!joinedClasses || joinedClasses.length === 0) {
        $('#classrooms_list_add').html('<div style="text-align:center; padding:20px; color:var(--text-muted);">لم تنضم إلى أي فصل دراسي حتى الآن. استخدم صندوق الانضمام أعلاه.</div>');
        return;
    }

    var html = '<div class="classroom-grid">';
    joinedClasses.forEach(cls => {
        var classNum = getClassNumber(cls.class_code);
        html += `
            <div class="classroom-card">
                <div class="cls-name">${cls.class_name}</div>
                <div class="cls-code">رمز الانضمام: ${classNum} 
                    <span class="copy-icon" onclick="event.stopPropagation(); copyToClipboard('${classNum}')" title="نسخ رمز الفصل">📋 نسخ</span>
                </div>
                <div class="cls-actions">
                    <button class="desine-btn" style="background:#10b981; padding:6px 14px; font-size:0.75rem;" onclick="manageSingleClassroom('${cls.class_code}', '${escapeHtml(cls.class_name)}')"><i class="fas fa-door-open"></i> فتح الفصل</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    $('#classrooms_list_add').html(html);
}

async function manageSingleClassroom(code, name) {
    go_page('page_classroom_single');
    $('#single_cls_title').text('فصل: ' + name);
    $('#single_cls_code').text(code);
    window.currentManagingClassCode = code;

    $('#teacher_add_exam_to_cls_box').addClass('Dnone').hide();
    $('#teacher_add_content_box').addClass('Dnone').hide();

    $('#inside_join_section').show();

    loadSingleClassroomExams(code);
    loadSingleClassroomContents(code);
    loadSingleClassroomStudents(code);
}

async function loadSingleClassroomExams(code) {
    $('#single_cls_exams_container').html('<div style="text-align:center; padding:20px; color:#64748b;">جاري تحميل الاختبارات...</div>');
    let { data, error } = await window._supabase
        .from('classroom_exams')
        .select('*')
        .eq('class_code', code);

    if (error || !data || data.length === 0) {
        $('#single_cls_exams_container').html('<div style="text-align:center; padding:20px; color:#64748b; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">لا توجد اختبارات مرتبطة بهذا الفصل.</div>');
        return;
    }

    let html = '<div style="max-width:700px; margin:0 auto;">';
    data.forEach(ex => {
        html += `
            <div class="exam-card-item">
                <div class="exam-info">
                    <div class="exam-name"><i class="fas fa-file-alt" style="color:#3b82f6; margin-left:8px;"></i>${ex.exam_name}</div>
                    <div class="exam-number">رقم الاختبار: ${ex.exam_number} 
                        <span class="copy-icon" onclick="event.stopPropagation(); copyToClipboard('${ex.exam_number}')" title="نسخ رقم الاختبار">📋 نسخ</span>
                    </div>
                </div>
                <div class="exam-actions">
                    <button class="desine-btn" style="background:linear-gradient(135deg, #2563eb, #1d4ed8); padding:8px 16px; font-size:0.8rem; box-shadow:0 4px 12px rgba(37,99,235,0.3);" onclick="searchAndStartExamByNum(${ex.exam_number})">
                        <i class="fas fa-play-circle"></i> فتح الاختبار
                    </button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    $('#single_cls_exams_container').html(html);
}

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
                    <a href="${item.body}" target="_blank" class="desine-btn" style="background:#0284c7; display:inline-block; padding:10px 35px; text-decoration:none; border-radius:10px; font-weight:800; font-size:0.95rem; box-shadow:0 4px 12px rgba(2,132,199,0.3);">
                        <i class="fas fa-external-link-alt"></i>  فتح في المتصفح
                    </a>
                </div>
            `;
        } else {
            bodyContent = `<p style="margin:8px 0 0 0; white-space:pre-wrap; color:#334155; font-weight:600; line-height:1.8; font-size:0.95rem;">${item.body}</p>`;
        }

        html += `
            <div style="background:#ffffff; border-radius:14px; border:1.5px solid #e2e8f0; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px; background:linear-gradient(135deg, ${badgeColor}15 0%, ${badgeColor}08 100%); border-bottom:1px solid #e2e8f0;">
                    <span style="background:${badgeColor}; color:#fff; padding:4px 14px; border-radius:20px; font-size:0.75rem; font-weight:800;">
                        <i class="fas ${icon}"></i> ${badgeName}
                    </span>
                </div>
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

async function loadSingleClassroomStudents(code) {
    let currentUser = localStorage.getItem('loginEmail') || '';
    let isTeacher = localStorage.getItem('loginState') === 'login=OK';
    
    let { data: clsData, error: clsErr } = await window._supabase
        .from('classrooms')
        .select('teacher_email')
        .eq('class_code', code)
        .single();
    
    if (clsErr) {
        $('#single_cls_students_list').html('<p style="color:#64748b; margin:0;">خطأ في تحميل بيانات الفصل</p>');
        return;
    }
    
    let isOwner = isTeacher && clsData && clsData.teacher_email.toLowerCase() === currentUser.trim().toLowerCase();
    
    if (!isOwner) {
        $('#single_cls_students_list').html('<p style="color:#64748b; margin:0; text-align:center;">عدد الطلاب المنضمين: (غير مرئي للمستخدم العادي)</p>');
        return;
    }
    
    try {
        let { data } = await window._supabase
            .from('classroom_students')
            .select('*')
            .eq('class_code', code);

        if (!data || data.length === 0) {
            $('#single_cls_students_list').html('<p style="color:#64748b; margin:0;">لا يوجد طلاب منضمون حتى الآن.</p>');
        } else {
            let html = '<ul style="margin:0; padding-right:20px; text-align:right; list-style:none;">';
            data.forEach((s, idx) => {
                html += `<li style="padding:6px 0; border-bottom:1px solid #e2e8f0;"><b>${idx + 1}. ${s.student_name}</b></li>`;
            });
            html += '</ul>';
            $('#single_cls_students_list').html(html);
        }
    } catch (e) {
        $('#single_cls_students_list').html('<p style="color:#64748b; margin:0;">لا يمكن تحميل الطلاب حالياً (غير متصل).</p>');
    }
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

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ تم نسخ: ' + text);
        }).catch(() => {
            fallbackCopyText(text);
        });
    } else {
        fallbackCopyText(text);
    }
}

function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('✅ تم نسخ: ' + text);
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
        $('#loginEmail').text('مرحبًا بك: ' + window.loginEmail);
        $('#logout_btn').show();
        readAll_exam_saveded_new();
    } else {
        $('#logout_btn').hide();
        readAll_student_exams_sync([]);
    }
});
