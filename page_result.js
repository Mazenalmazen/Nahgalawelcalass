var currentExamResultsCache = [];

async function load_exam_results(exam_number) {
    if (!exam_number) return;
    window.currentExamNumberForResults = exam_number;

    // ✅ جلب عدد أسئلة الاختبار لتستخدمه دالة النسبة
    try {
        let { data: examInfo } = await window._supabase
            .from('exams')
            .select('exam_data')
            .eq('exam_number', exam_number)
            .single();
        if (examInfo && examInfo.exam_data && Array.isArray(examInfo.exam_data.questions)) {
            window.__currentExamTotalQuestions = examInfo.exam_data.questions.length;
        } else {
            window.__currentExamTotalQuestions = 0;
        }
    } catch (e) {
        window.__currentExamTotalQuestions = 0;
    }

    $('#showresult').html('<div style="text-align:center; padding:30px;"><img id="img_load_result" src="img/load.gif" /></div>');
    
    let { data, error } = await window._supabase
        .from('results')
        .select('*')
        .eq('exam_number', exam_number)
        .order('submitted_at', { ascending: false });

    if (error) {
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'خطأ في جلب النتائج: ' + error.message,
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#4f46e5'
            });
        } else {
            alert('خطأ في جلب النتائج: ' + error.message);
        }
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
            <button class="desine-btn" onclick="analyzeResultsWithAI()" style="background:linear-gradient(135deg, #7c3aed, #4f46e5); padding:10px 25px; font-size:0.95rem; display:inline-block; margin:0; box-shadow:0 4px 15px rgba(124,58,237,0.35);">
                <i class="fas fa-robot"></i> تحليل ذكي للنتائج
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
    let totalObtainedSum = 0;
    let validCount = 0;
    resultsArray.forEach(res => {
        if (res.degree) {
            const degreeStr = String(res.degree).trim();
            let obtained = 0;
            if (degreeStr.includes('/')) {
                let parts = degreeStr.split('/');
                if (parts.length === 2) obtained = parseFloat(parts[0]);
            } else {
                obtained = parseFloat(degreeStr);
            }
            if (!isNaN(obtained)) {
                totalObtainedSum += obtained;
                validCount++;
            }
        }
    });
    let avg = validCount > 0 ? (totalObtainedSum / validCount).toFixed(1) : '0.0';

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

        // ✅ إصلاح: يدعم الصيغتين "32/40" و "32"
        let percentage = '-';
        if (res.degree) {
            let degreeStr = String(res.degree).trim();
            let obtained = 0;
            let total = 0;

            if (degreeStr.includes('/')) {
                let parts = degreeStr.split('/');
                if (parts.length === 2) {
                    obtained = parseFloat(parts[0]);
                    total = parseFloat(parts[1]);
                }
            } else {
                obtained = parseFloat(degreeStr);
                total = window.__currentExamTotalQuestions || 0;
            }

            if (total > 0 && !isNaN(obtained)) {
                percentage = ((obtained / total) * 100).toFixed(0) + '%';
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
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: 'الرجاء تحديد طالب واحد على الأقل',
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#4f46e5'
            });
        } else {
            alert('الرجاء تحديد طالب واحد على الأقل');
        }
        return;
    }
    let text = names.join('\n');
    copyToClipboard(text);
    if (typeof Swal !== 'undefined' && Swal.fire) {
        Swal.fire({
            icon: 'success',
            title: 'نجاح',
            text: 'تم نسخ ' + names.length + ' اسم بنجاح',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#4f46e5'
        });
    } else {
        alert('تم نسخ ' + names.length + ' اسم بنجاح');
    }
}

function copyAllStudentNames() {
    let names = getAllStudentNames();
    if (names.length === 0) {
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
                icon: 'info',
                title: 'معلومة',
                text: 'لا توجد أسماء للنسخ',
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#4f46e5'
            });
        } else {
            alert('لا توجد أسماء للنسخ');
        }
        return;
    }
    let text = names.join('\n');
    copyToClipboard(text);
    if (typeof Swal !== 'undefined' && Swal.fire) {
        Swal.fire({
            icon: 'success',
            title: 'نجاح',
            text: 'تم نسخ جميع الأسماء (' + names.length + ' اسم)',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#4f46e5'
        });
    } else {
        alert('تم نسخ جميع الأسماء (' + names.length + ' اسم)');
    }
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
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: 'رقم الاختبار غير محدد',
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#4f46e5'
            });
        } else {
            alert('رقم الاختبار غير محدد');
        }
        return;
    }

    let confirmed = false;
    if (typeof Swal !== 'undefined' && Swal.fire) {
        let result = await Swal.fire({
            icon: 'question',
            title: 'تأكيد إعادة الحساب',
            html: 'سيتم إعادة حساب درجات جميع الطلاب بناءً على الإجابات الصحيحة الحالية.<br><small style="color:#64748b;">ملاحظة: يتم استخدام ترتيب الأسئلة والإجابات كما ظهرت للطالب عند أداء الاختبار.</small>',
            showCancelButton: true,
            confirmButtonText: 'نعم، أعد الحساب',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#64748b'
        });
        confirmed = result.isConfirmed;
    } else {
        confirmed = confirm('سيتم إعادة حساب درجات جميع الطلاب بناءً على الإجابات الصحيحة الحالية.\n\nهل تريد المتابعة؟');
    }
    
    if (!confirmed) return;

    $('#load').show();

    try {
        let { data: examData, error: examErr } = await window._supabase
            .from('exams')
            .select('exam_data')
            .eq('exam_number', exam_number)
            .single();

        if (examErr || !examData) {
            $('#load').hide();
            alert('تعذر جلب بيانات الاختبار');
            return;
        }

        let questions = examData.exam_data?.questions || [];

        if (questions.length === 0) {
            $('#load').hide();
            alert('لا توجد أسئلة في هذا الاختبار');
            return;
        }

        let { data: results, error: resErr } = await window._supabase
            .from('results')
            .select('*')
            .eq('exam_number', exam_number);

        if (resErr) {
            $('#load').hide();
            alert('تعذر جلب النتائج: ' + resErr.message);
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

        for (let res of results) {
            let studentAnswers = res.answers_data || {};
            let newObtained = 0;

            let activeQuestions = res.active_questions || questions;
            
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

        let msg = 'تم إعادة حساب النتائج بنجاح\n\n';
        msg += 'الطلاب الذين تغيرت درجاتهم: ' + updatedCount + '\n';
        msg += 'الطلاب الذين بقيت درجاتهم كما هي: ' + unchangedCount + '\n';
        
        if (failedCount > 0) {
            msg += 'فشل تحديث: ' + failedCount + ' طالب\n';
        }
        
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
                icon: 'success',
                title: 'نجاح',
                html: msg.replace(/\n/g, '<br>'),
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#4f46e5'
            });
        } else {
            alert(msg);
        }

        load_exam_results(exam_number);

    } catch (e) {
        $('#load').hide();
        alert('حدث خطأ: ' + e.message);
    }
}

function showHonorBoardModal() {
    let resultsArray = currentExamResultsCache || [];
    let honorStudents = resultsArray.filter(res => {
        if (!res.degree) return false;
        let degreeStr = String(res.degree).trim();
        let obtained = 0, total = 0;
        if (degreeStr.includes('/')) {
            let parts = degreeStr.split('/');
            if (parts.length === 2) {
                obtained = parseFloat(parts[0]);
                total = parseFloat(parts[1]);
            }
        } else {
            obtained = parseFloat(degreeStr);
            total = window.__currentExamTotalQuestions || 0;
        }
        if (total > 0 && !isNaN(obtained)) {
            let percentage = (obtained / total) * 100;
            return percentage >= 98;
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

// ===== مراجعة إجابات الطالب =====
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
        sorted.sort((a, b) => {
            let aVal = parseFloat(String(a.degree).split('/')[0]) || 0;
            let bVal = parseFloat(String(b.degree).split('/')[0]) || 0;
            return bVal - aVal;
        });
    } else if (criteria === 'degree_asc') {
        sorted.sort((a, b) => {
            let aVal = parseFloat(String(a.degree).split('/')[0]) || 0;
            let bVal = parseFloat(String(b.degree).split('/')[0]) || 0;
            return aVal - bVal;
        });
    } else if (criteria === 'name') {
        sorted.sort((a, b) => a.student_name.localeCompare(b.student_name, 'ar'));
    }

    renderResultsTable(sorted);
}

async function delete_result() {
    var exam_number = window.currentExamNumberForResults;
    if (!exam_number) {
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: 'رقم الاختبار غير محدد',
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#4f46e5'
            });
        } else {
            alert('رقم الاختبار غير محدد');
        }
        return;
    }

    let confirmed = false;
    if (typeof Swal !== 'undefined' && Swal.fire) {
        let result = await Swal.fire({
            icon: 'warning',
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف جميع نتائج هذا الاختبار نهائياً؟',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b'
        });
        confirmed = result.isConfirmed;
    } else {
        confirmed = confirm('هل أنت متأكد من حذف جميع نتائج هذا الاختبار نهائياً؟');
    }

    if (!confirmed) return;

    $('#load').show();
    let { error } = await window._supabase
        .from('results')
        .delete()
        .eq('exam_number', exam_number);

    $('#load').hide();

    if (error) {
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'خطأ أثناء حذف النتائج: ' + error.message,
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#4f46e5'
            });
        } else {
            alert('خطأ أثناء حذف النتائج: ' + error.message);
        }
    } else {
        if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
                icon: 'success',
                title: 'نجاح',
                text: 'تم حذف النتائج بنجاح',
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#4f46e5'
            });
        } else {
            alert('تم حذف النتائج بنجاح');
        }
        load_exam_results(exam_number);
    }
}

function save_excel() {
    if (typeof Swal !== 'undefined' && Swal.fire) {
        Swal.fire({
            icon: 'info',
            title: 'معلومة',
            text: 'سيتم تصدير ملف النتائج بصيغة Excel قريباً.',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#4f46e5'
        });
    } else {
        alert('تم تجهيز البيانات، سيتم تصدير ملف النتائج بصيغة Excel قريباً.');
    }
}
