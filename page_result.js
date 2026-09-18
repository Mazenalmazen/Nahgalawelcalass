let currentExamResultsCache = [];

async function load_exam_results(exam_number) {
    if (!exam_number) return;
    window.currentExamNumberForResults = exam_number;

    $('#showresult').html('<div style="text-align:center; padding:30px;"><img id="img_load_result" src="img/load.gif" /></div>');
    
    let { data, error } = await window._supabase
        .from('results')
        .select('*')
        .eq('exam_number', exam_number)
        .order('submitted_at', { ascending: false });

    if (error) {
        alert('خطأ في جلب النتائج: ' + error.message);
        $('#showresult').html('<div style="text-align:center; padding:30px; color:var(--danger);">حدث خطأ في جلب النتائج</div>');
        return;
    }

    currentExamResultsCache = data || [];
    renderResultsTable(currentExamResultsCache);
}

function renderResultsTable(resultsArray) {
    if (!resultsArray || resultsArray.length === 0) {
        $('#showresult').html('<div style="text-align:center; padding:30px; color:var(--text-muted);">لا توجد نتائج مسجلة للطلاب حتى الآن</div>');
        return;
    }

    // ===== أزرار التحكم في النتائج =====
    let controlButtonsHtml = `
        <div style="text-align:center; margin-bottom:15px; display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
            <button class="desine-btn" onclick="recalculateExamResults(${window.currentExamNumberForResults})" style="background:#f59e0b; padding:10px 25px; font-size:0.95rem; display:inline-block; margin:0;">
                <i class="fas fa-calculator"></i> إعادة حساب النتائج
            </button>
        </div>
    `;

    let copyButtonHtml = `
        <div style="text-align:center; margin-bottom:15px; display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
            <button class="desine-btn" onclick="copySelectedStudentNames()" style="background:#4f46e5; padding:10px 25px; font-size:0.95rem; display:inline-block; margin:0;">
                <i class="fas fa-copy"></i> نسخ الأسماء المحددة
            </button>
            <button class="desine-btn" onclick="copyAllStudentNames()" style="background:#10b981; padding:10px 25px; font-size:0.95rem; display:inline-block; margin:0;">
                <i class="fas fa-copy"></i> نسخ جميع الأسماء
            </button>
            <button class="desine-btn" onclick="selectAllStudents()" style="background:#8b5cf6; padding:10px 25px; font-size:0.95rem; display:inline-block; margin:0;">
                <i class="fas fa-check-double"></i> تحديد الكل
            </button>
            <button class="desine-btn" onclick="deselectAllStudents()" style="background:#64748b; padding:10px 25px; font-size:0.95rem; display:inline-block; margin:0;">
                <i class="fas fa-times"></i> إلغاء التحديد
            </button>
        </div>
    `;

    let totalStudents = resultsArray.length;
    let totalDegrees = 0;
    let validCount = 0;
    resultsArray.forEach(res => {
        if (res.degree) {
            let parts = String(res.degree).split('/');
            if (parts.length === 2) {
                let obtained = parseFloat(parts[0]);
                if (!isNaN(obtained)) {
                    totalDegrees += obtained;
                    validCount++;
                }
            }
        }
    });
    let avg = validCount > 0 ? (totalDegrees / validCount).toFixed(1) : '0.0';

    let headerHtml = `
        <div class="results-header">
            <div class="stat-item">
                <span class="label">اسم الاختبار:</span>
                <span class="value" style="font-size:1rem;">${window.currentLoadedExam?.exam_name || 'غير محدد'}</span>
            </div>
            <div class="stat-item">
                <span class="label">عدد الطلاب:</span>
                <span class="value">${totalStudents}</span>
            </div>
            <div class="stat-item">
                <span class="label">متوسط الدرجة:</span>
                <span class="value">${avg}</span>
            </div>
        </div>
    `;

    var html = controlButtonsHtml + copyButtonHtml + headerHtml + `<table class="results-table" style="width:95%; max-width:750px; margin:auto; border-collapse:collapse; font-size:0.85rem;">
        <thead>
            <tr>
                <th style="width:5%;"><input type="checkbox" id="select_all_checkbox" onchange="toggleAllCheckboxes(this)"></th>
                <th style="width:8%;">#</th>
                <th style="width:35%;">اسم الطالب</th>
                <th style="width:22%;">معلومات إضافية</th>
                <th style="width:18%;">التاريخ</th>
                <th style="width:10%;">الدرجة</th>
                <th style="width:7%;">النسبة</th>
                <th style="width:10%;">إجراء</th>
            </tr>
        </thead>
        <tbody>`;

    resultsArray.forEach((res, index) => {
        let dateStr = res.submitted_at ? new Date(res.submitted_at).toLocaleString('ar-SA') : 'وقت غير متوفر';
        let encodedResData = encodeURIComponent(JSON.stringify(res));

        let percentage = '-';
        if (res.degree) {
            let parts = String(res.degree).split('/');
            if (parts.length === 2) {
                let obtained = parseFloat(parts[0]);
                let total = parseFloat(parts[1]);
                if (total > 0) {
                    percentage = ((obtained / total) * 100).toFixed(0) + '%';
                }
            }
        }

        html += `<tr>
            <td><input type="checkbox" class="student-checkbox" data-student-name="${escapeHtml(res.student_name)}" data-student-info="${escapeHtml(res.student_info || '')}"></td>
            <td>${index + 1}</td>
            <td style="font-weight:800; color:#1e293b; text-align:right;">${res.student_name}</td>
            <td style="font-size:0.8rem;">${res.student_info || '-'}</td>
            <td style="font-size:0.7rem; color:#64748b;">${dateStr}</td>
            <td><b style="color:#0284c7;">${res.degree}</b></td>
            <td><span class="percentage-badge" style="font-size:0.7rem;">${percentage}</span></td>
            <td>
                <button class="desine-btn" style="padding:4px 10px; font-size:0.65rem; background:#4338ca; margin:0; border-radius:30px;" onclick="reviewStudentPaper('${encodedResData}')" title="مراجعة الإجابات">
                    <i class="fas fa-eye"></i> مراجعة
                </button>
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    $('#showresult').html(html);
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toggleAllCheckboxes(masterCheckbox) {
    let checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = masterCheckbox.checked;
    });
}

function selectAllStudents() {
    let checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(cb => cb.checked = true);
    let master = document.getElementById('select_all_checkbox');
    if (master) master.checked = true;
}

function deselectAllStudents() {
    let checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    let master = document.getElementById('select_all_checkbox');
    if (master) master.checked = false;
}

function getSelectedStudentNames() {
    let checkboxes = document.querySelectorAll('.student-checkbox:checked');
    let names = [];
    checkboxes.forEach(cb => {
        let name = cb.getAttribute('data-student-name');
        if (name) names.push(name);
    });
    return names;
}

function getAllStudentNames() {
    let checkboxes = document.querySelectorAll('.student-checkbox');
    let names = [];
    checkboxes.forEach(cb => {
        let name = cb.getAttribute('data-student-name');
        if (name) names.push(name);
    });
    return names;
}

function copySelectedStudentNames() {
    let names = getSelectedStudentNames();
    if (names.length === 0) {
        alert('الرجاء تحديد طالب واحد على الأقل');
        return;
    }
    let text = names.join('\n');
    copyToClipboard(text);
    alert(`✅ تم نسخ ${names.length} اسم بنجاح`);
}

function copyAllStudentNames() {
    let names = getAllStudentNames();
    if (names.length === 0) {
        alert('لا توجد أسماء للنسخ');
        return;
    }
    let text = names.join('\n');
    copyToClipboard(text);
    alert(`✅ تم نسخ جميع الأسماء (${names.length} اسم)`);
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
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
}

// ===== إعادة حساب النتائج بعد تعديل الإجابات الصحيحة =====
async function recalculateExamResults(exam_number) {
    if (!exam_number) {
        alert('رقم الاختبار غير محدد');
        return;
    }

    if (!confirm('سيتم إعادة حساب درجات جميع الطلاب بناءً على الإجابات الصحيحة الحالية.\n\nملاحظة: يتم استخدام ترتيب الأسئلة والإجابات كما ظهرت للطالب عند أداء الاختبار.\n\nهل تريد المتابعة؟')) {
        return;
    }

    $('#load').show();

    try {
        // 1) جلب بيانات الاختبار (الأسئلة والإجابات الصحيحة الحالية)
        let { data: examData, error: examErr } = await window._supabase
            .from('exams')
            .select('exam_data')
            .eq('exam_number', exam_number)
            .single();

        if (examErr || !examData) {
            $('#load').hide();
            alert('❌ تعذر جلب بيانات الاختبار');
            return;
        }

        let questions = examData.exam_data?.questions || [];

        if (questions.length === 0) {
            $('#load').hide();
            alert('⚠️ لا توجد أسئلة في هذا الاختبار');
            return;
        }

        // 2) جلب جميع نتائج الطلاب
        let { data: results, error: resErr } = await window._supabase
            .from('results')
            .select('*')
            .eq('exam_number', exam_number);

        if (resErr) {
            $('#load').hide();
            alert('❌ تعذر جلب النتائج: ' + resErr.message);
            return;
        }

        if (!results || results.length === 0) {
            $('#load').hide();
            alert('لا توجد نتائج لإعادة حسابها');
            return;
        }

        let updatedCount = 0;
        let unchangedCount = 0;
        let failedCount = 0;

        // 3) إعادة حساب الدرجة لكل طالب
        for (let res of results) {
            let studentAnswers = res.answers_data || {};
            let newObtained = 0;

            // ✅ استخدام الأسئلة النشطة المحفوظة مع النتيجة إن وُجدت
            // (لدعم بنك الأسئلة والترتيب العشوائي للأسئلة)
            let activeQuestions = res.active_questions || questions;
            
            // إذا كانت الأسئلة النشطة فارغة أو غير موجودة، نستخدم أسئلة الاختبار الكاملة
            if (!activeQuestions || activeQuestions.length === 0) {
                activeQuestions = questions;
            }

            activeQuestions.forEach((q, idx) => {
                let stdAns = studentAnswers['q_' + idx] || '';
                let correctIdx = (q.correctIndex !== undefined) ? q.correctIndex : 0;
                let correctAns = (q.options && q.options[correctIdx] !== undefined) 
                    ? q.options[correctIdx] 
                    : '';

                if (stdAns && stdAns === correctAns) {
                    newObtained++;
                }
            });

            let totalCount = activeQuestions.length;
            let newGradeText = newObtained + '/' + totalCount;

            // مقارنة مع الدرجة القديمة
            if (String(res.degree) !== String(newGradeText)) {
                let { error: updErr } = await window._supabase
                    .from('results')
                    .update({ degree: newGradeText })
                    .eq('id', res.id);

                if (updErr) {
                    console.error('فشل تحديث نتيجة الطالب ' + res.student_name + ': ' + updErr.message);
                    failedCount++;
                } else {
                    updatedCount++;
                }
            } else {
                unchangedCount++;
            }
        }

        $('#load').hide();

        // عرض تقرير النتائج
        let msg = '✅ تم إعادة حساب النتائج بنجاح\n\n';
        msg += '📊 الطلاب الذين تغيرت درجاتهم: ' + updatedCount + '\n';
        msg += '⚪ الطلاب الذين بقيت درجاتهم كما هي: ' + unchangedCount + '\n';
        
        if (failedCount > 0) {
            msg += '❌ فشل تحديث: ' + failedCount + ' طالب\n';
        }
        
        alert(msg);

        // إعادة تحميل الجدول
        load_exam_results(exam_number);

    } catch (e) {
        $('#load').hide();
        alert('❌ حدث خطأ: ' + e.message);
    }
}

function showHonorBoardModal() {
    let resultsArray = currentExamResultsCache || [];
    let honorStudents = resultsArray.filter(res => {
        if (!res.degree) return false;
        let parts = String(res.degree).split('/');
        if (parts.length === 2) {
            let obtained = parseFloat(parts[0]);
            let total = parseFloat(parts[1]);
            if (total > 0) {
                let percentage = (obtained / total) * 100;
                return percentage >= 98;
            }
        }
        return false;
    });

    let honorHtml = `<div id="honor_board_modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:99999; display:flex; align-items:center; justify-content:center;">
        <div style="background:#fff; padding:30px; border-radius:20px; width:92%; max-width:500px; max-height:85vh; overflow-y:auto; text-align:center; box-shadow:0 25px 50px -12px rgba(0,0,0,0.3);">
            <div style="font-size:3rem; color:#f59e0b; margin-bottom:5px;"><i class="fas fa-award"></i></div>
            <h2 style="color:var(--primary); margin-top:0;">لوحة الشرف والتميز</h2>
            <p style="color:var(--text-muted); font-size:0.95rem;">نخبة الطلاب الحاصلين على نسبة إتقان تفوق 98% في هذا الاختبار</p>
            <hr style="margin:20px 0;">`;

    if (honorStudents.length === 0) {
        honorHtml += `<p style="color:#64748b; padding:20px;">لا يوجد طلاب ضمن لوحة الشرف (98% فأكثر) حتى الآن.</p>`;
    } else {
        honorHtml += `<table style="width:100%; margin:0; border:none; box-shadow:none;">
            <thead>
                <tr>
                    <th>المرتبة</th>
                    <th>اسم الطالب</th>
                    <th>الدرجة</th>
                </tr>
            </thead>
            <tbody>`;
        
        honorStudents.forEach((st, idx) => {
            let medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐';
            honorHtml += `<tr>
                <td><b>${medal} #${idx + 1}</b></td>
                <td><b>${st.student_name}</b></td>
                <td><span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:6px; font-weight:bold;">${st.degree}</span></td>
            </tr>`;
        });

        honorHtml += `</tbody></table>`;
    }

    honorHtml += `<br>
            <button class="desine-btn" style="width:100%; background:#64748b; padding:12px; margin-top:15px;" onclick="$('#honor_board_modal').remove()">إغلاق لوحة الشرف</button>
        </div>
    </div>`;

    $('#honor_board_modal').remove();
    $('body').append(honorHtml);
}

// ===== مراجعة إجابات الطالب (باستخدام correctIndex) =====
async function reviewStudentPaper(encodedJson) {
    let resObj = JSON.parse(decodeURIComponent(encodedJson));
    let examNum = resObj.exam_number;

    let { data: examData, error } = await window._supabase
        .from('exams')
        .select('*')
        .eq('exam_number', examNum)
        .single();

    let questionsList = examData?.exam_data?.questions || [];
    let studentAnswers = resObj.answers_data || {};
    
    // ✅ استخدام الأسئلة النشطة المحفوظة مع النتيجة (لدعم بنك الأسئلة)
    if (resObj.active_questions && Array.isArray(resObj.active_questions) && resObj.active_questions.length > 0) {
        questionsList = resObj.active_questions;
    }
    
    var numbers = ['❶', '❷', '❸', '❹'];

    let modalHtml = `<div id="student_review_modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; align-items:center; justify-content:center;">
        <div style="background:#fff; padding:25px; border-radius:16px; width:92%; max-width:650px; max-height:85vh; overflow-y:auto; text-align:right; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
            <h3 style="color:var(--primary); margin-top:0; text-align:center;"><i class="fas fa-clipboard-check"></i> مراجعة إجابات الطالب</h3>
            <div style="background:#f1f5f9; padding:12px; border-radius:8px; text-align:center; margin-bottom:15px;">
                <p style="margin:0; font-size:1.05rem; font-weight:800; color:#1e293b;">اسم الطالب: ${resObj.student_name}</p>
                <p style="margin:4px 0 0 0; color:#64748b; font-size:0.9rem;">الدرجة النهائية: <b>${resObj.degree}</b> | معلومات إضافية: ${resObj.student_info || 'لا توجد'}</p>
            </div>
            <hr>`;

    if (questionsList.length === 0) {
        modalHtml += `<p style="text-align:center; color:#ef4444;">تعذر العثور على تفاصيل أسئلة هذا الاختبار.</p>`;
    } else {
        questionsList.forEach((q, qIdx) => {
            let stdAns = studentAnswers['q_' + qIdx] || 'لم يجب';
            
            // ✅ استخدام correctIndex لتحديد الإجابة الصحيحة
            let correctIdx = (q.correctIndex !== undefined) ? q.correctIndex : 0;
            let correctAns = (q.options && q.options.length > 0 && q.options[correctIdx] !== undefined)
                ? q.options[correctIdx]
                : (q.options && q.options.length > 0 ? q.options[0] : '');
            
            let isCorrect = (stdAns === correctAns && stdAns !== 'لم يجب');
            let boxBg = isCorrect ? '#f0fdf4' : '#fef2f2';
            let boxBorder = isCorrect ? '#bbf7d0' : '#fecaca';
            let badgeText = isCorrect ? '<span style="color:#16a34a; font-weight:bold;">إجابتك صحيحة ✓</span>' : '<span style="color:#dc2626; font-weight:bold;">إجابتك خاطئة ✗</span>';

            modalHtml += `<div style="background:${boxBg}; padding:20px; margin:15px 0; border-radius:12px; border:1.5px solid ${boxBorder};">
                <p style="font-weight:800; color:#1e293b; margin-bottom:5px;">السؤال رقم ${qIdx + 1}</p>
                <div style="width:100%; min-height:45px; padding:12px 14px; border-radius:8px; border:1.5px solid var(--border-color); background-color:#f8fafc; color:#0f172a; font-weight:750; margin-bottom:15px; white-space:pre-wrap; word-break:break-word;">${q.question || ''}</div>`;
            
            if (q.options && q.options.length > 0) {
                q.options.forEach((opt, oIndex) => {
                    if (opt) {
                        let isSelected = (stdAns === opt);
                        let optStyle = isSelected ? 'border-color:#2563eb; background:#eff6ff; font-weight:800;' : 'background:#ffffff;';
                        
                        modalHtml += `<div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; margin:8px 0; border-radius:8px; border:1.5px solid #cbd5e1; ${optStyle}">
                            <div style="display:flex; align-items:center;">
                                <span style="font-size:1.1rem; margin-left:10px; font-weight:800; color:#4338ca;">${numbers[oIndex] || ''}</span>
                                <span>${opt} ${isSelected ? '(اختيار الطالب)' : ''}</span>
                            </div>
                        </div>`;
                    }
                });
            }

            modalHtml += `<p style="margin:10px 0 0 0; font-size:0.95rem; font-weight:bold;">حالة الإجابة: [ ${badgeText} ]</p>`;
            
            if (!isCorrect) {
                modalHtml += `<p style="margin:6px 0 0 0; font-size:0.95rem; color:#16a34a; font-weight:bold;">الإجابة الصحيحة النموذجية: ${correctAns}</p>`;
            }

            modalHtml += `</div>`;
        });
    }

    modalHtml += `<br>
            <button class="desine-btn" style="width:100%; background:#64748b; padding:12px;" onclick="$('#student_review_modal').remove()">إغلاق المراجعة</button>
        </div>
    </div>`;

    $('#student_review_modal').remove();
    $('body').append(modalHtml);
}

function sortResultsByCriteria(criteria) {
    if (!currentExamResultsCache || currentExamResultsCache.length === 0) return;

    let sorted = [...currentExamResultsCache];

    if (criteria === 'date') {
        sorted.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    } else if (criteria === 'degree_desc') {
        sorted.sort((a, b) => Number(b.degree) - Number(a.degree));
    } else if (criteria === 'degree_asc') {
        sorted.sort((a, b) => Number(a.degree) - Number(b.degree));
    } else if (criteria === 'name') {
        sorted.sort((a, b) => a.student_name.localeCompare(b.student_name, 'ar'));
    }

    renderResultsTable(sorted);
}

async function delete_result() {
    var exam_number = window.currentExamNumberForResults;
    if (!exam_number) {
        alert('رقم الاختبار غير محدد');
        return;
    }

    if (!confirm('هل أنت متأكد من حذف جميع نتائج هذا الاختبار نهائياً؟')) {
        return;
    }

    $('#load').show();
    let { error } = await window._supabase
        .from('results')
        .delete()
        .eq('exam_number', exam_number);

    $('#load').hide();

    if (error) {
        alert('خطأ أثناء حذف النتائج: ' + error.message);
    } else {
        alert('تم حذف النتائج بنجاح');
        load_exam_results(exam_number);
    }
}

function save_excel() {
    alert('تم تجهيز البيانات، سيتم تصدير ملف النتائج بصيغة Excel قريباً.');
}
