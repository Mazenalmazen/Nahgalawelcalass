let currentExamResultsCache = [];

async function load_exam_results(exam_number) {
    if (!exam_number) return;
    window.currentExamNumberForResults = exam_number;

    $('#showresult').html('<tr><td colspan="5"><img id="img_load_result" src="img/load.gif" /></td></tr>');
    
    let { data, error } = await window._supabase
        .from('results')
        .select('*')
        .eq('exam_number', exam_number)
        .order('submitted_at', { ascending: false });

    if (error) {
        alert('خطأ في جلب النتائج: ' + error.message);
        $('#showresult').html('<tr><td colspan="5">حدث خطأ في جلب النتائج</td></tr>');
        return;
    }

    currentExamResultsCache = data || [];
    renderResultsTable(currentExamResultsCache);
}

function renderResultsTable(resultsArray) {
    if (!resultsArray || resultsArray.length === 0) {
        $('#showresult').html('<tr><td colspan="5">لا توجد نتائج مسجلة للطلاب حتى الآن</td></tr>');
        return;
    }

    let honorBoardBtnContainer = $('#honor_board_btn_wrapper');
    if (honorBoardBtnContainer.length === 0) {
        $('#option_result').after(`<div id="honor_board_btn_wrapper" style="text-align:center; margin:10px auto;">
            <button class="desine-btn" style="background:#f59e0b; padding:8px 18px; font-size:0.9rem;" onclick="showHonorBoardModal()"><i class="fas fa-award"></i> عرض لوحة الشرف (98% - 100%)</button>
        </div>`);
    }

    var html = '';
    resultsArray.forEach((res, index) => {
        let dateStr = res.submitted_at ? new Date(res.submitted_at).toLocaleString('ar-SA') : 'وقت غير متوفر';
        let encodedResData = encodeURIComponent(JSON.stringify(res));

        html += `<tr>
            <td>${index + 1}</td>
            <td><b>${res.student_name}</b></td>
            <td>${res.student_info || '-'}</td>
            <td><span style="font-size:12px; color:#64748b;">${dateStr}</span></td>
            <td>
                <div style="display:flex; gap:5px; justify-content:center; align-items:center;">
                    <b style="color:#0284c7; font-size:1.05em;">${res.degree}</b>
                    <button class="desine-btn" style="padding:4px 8px; font-size:0.75rem; background:#4338ca; margin:0;" onclick="reviewStudentPaper('${encodedResData}')" title="مراجعة إجابات الطالب"><i class="fas fa-eye"></i> مراجعة</button>
                </div>
            </td>
        </tr>`;
    });

    $('#showresult').html(html);
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
            let correctAns = (q.options && q.options.length > 0) ? q.options[0] : '';
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
