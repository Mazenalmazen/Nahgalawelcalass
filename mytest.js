async function check_ans_empty() {
    var std_name = $('#shows_name').val();

    if (!std_name) {
        alert('الرجاء إدخال اسم الطالب الثلاثي أو الرباعي');
        return;
    }

    let allAnswered = true;
    let unansweredIndex = -1;

    $('.question_box').each(function(index) {
        let hasRadio = $(this).find('input[type="radio"]').length > 0;
        let answered = false;

        if (hasRadio) {
            if ($(this).find('input[type="radio"]:checked').length > 0) {
                answered = true;
            }
        } else {
            let textVal = $(this).find('.inputAns').val();
            if (textVal && textVal.trim() !== '') {
                answered = true;
            }
        }

        if (!answered) {
            allAnswered = false;
            unansweredIndex = index + 1;
            return false;
        }
    });

    if (!allAnswered) {
        alert(`عذراً، يجب عليك الإجابة على جميع الأسئلة قبل إنهاء الاختبار!\n(توجد إجابة فارغة في السؤال رقم ${unansweredIndex})`);
        return;
    }

    $('#Takeed').addClass('Dnone');
    $('#Tasleem').removeClass('Dnone');
    alert('تم التحقق من إجابتك لجميع الأسئلة. اضغط الآن على "تسليم الإجابات سحابياً" لإرسال النتيجة.');
}

async function get_ans_data() {
    var std_name = $('#shows_name').val();
    var std_info = $('#shows_info').val();

    if (!std_name) {
        alert('الرجاء إدخال اسم الطالب');
        return;
    }

    var exam_number = window.currentActiveExam ? window.currentActiveExam.exam_number : 0;

    let finishedExams = JSON.parse(localStorage.getItem('finished_exams') || '[]');
    if (finishedExams.includes(String(exam_number))) {
        alert('عذراً، لقد قمت بتسليم هذا الاختبار مسبقاً ولا يمكنك إرساله مرة أخرى.');
        go_page('page_home');
        return;
    }

    let submitBtn = $('#Tasleem');
    if (submitBtn.prop('disabled')) return;
    submitBtn.prop('disabled', true).css('opacity', '0.6');

    var answers = {};
    $('.question_box').each(function(index) {
        var selected_ans = $(this).find('input[type="radio"]:checked').val() || $(this).find('input[type="text"]').val() || '';
        answers['q_' + index] = selected_ans;
    });

    $('#load').show();

    let pseudoStudentNumber = 'std_' + Math.floor(10000 + Math.random() * 90000);
    let activeQuestionsForStudent = window.currentActiveExamQuestionsList || window.currentActiveExam?.exam_data?.questions || [];

    // استدعاء التصحيح السحابي مع إرسال الأسئلة النشطة التي ظهرت للطالب حصرياً
    let { data, error } = await window._supabase.rpc('submit_exam_result', {
        p_exam_number: Number(exam_number),
        p_student_name: String(std_name),
        p_student_number: String(pseudoStudentNumber),
        p_student_info: String(std_info || ''),
        p_answers_data: answers,
        p_active_questions: activeQuestionsForStudent
    });

    $('#load').hide();
    submitBtn.prop('disabled', false).css('opacity', '1');

    if (error) {
        alert('خطأ في إرسال النتائج: ' + error.message);
        return;
    }

    if (data && data.status === 'duplicate') {
        if (!finishedExams.includes(String(exam_number))) {
            finishedExams.push(String(exam_number));
            localStorage.setItem('finished_exams', JSON.stringify(finishedExams));
        }

        alert('عذراً، نتيجتك لهذا الامتحان مسجّلة مسبقاً ولا يمكن تسليم الاختبار أكثر من مرة.');
        go_page('page_home');
        $('#Tasleem').addClass('Dnone');
        $('#Takeed').removeClass('Dnone');
        if (typeof readAll_ans_saveded_new === 'function') {
            readAll_ans_saveded_new();
        }
        return;
    }

    if (!finishedExams.includes(String(exam_number))) {
        finishedExams.push(String(exam_number));
        localStorage.setItem('finished_exams', JSON.stringify(finishedExams));
    }

    let finalDegree = data?.degree ?? 0;
    let totalQuestionsCount = data?.total_questions ?? 0;
    let gradeText = `${finalDegree} / ${totalQuestionsCount}`;

    let studentGrades = JSON.parse(localStorage.getItem('student_grades') || '{}');
    studentGrades[exam_number] = gradeText;
    localStorage.setItem('student_grades', JSON.stringify(studentGrades));

    let studentSubmissions = JSON.parse(localStorage.getItem('student_submissions') || '{}');
    studentSubmissions[exam_number] = answers;
    localStorage.setItem('student_submissions', JSON.stringify(studentSubmissions));

    $('#Tasleem').addClass('Dnone');
    $('#Takeed').removeClass('Dnone');
    
    if (typeof readAll_ans_saveded_new === 'function') {
        readAll_ans_saveded_new();
    }

    openStudentFullReviewAfterSubmit(gradeText, exam_number, answers, activeQuestionsForStudent);
}

function openStudentFullReviewAfterSubmit(gradeText, exam_number, myAnswers, activeQuestions) {
    let exam = window.currentActiveExam;
    if (!exam) {
        alert('تم التسليم بنجاح. الدرجة: ' + gradeText);
        go_page('page_home');
        return;
    }

    var numbers = ['⓵', '⓶', '⓷', '⓸'];
    let questionsList = activeQuestions.length > 0 ? activeQuestions : (exam.exam_data?.questions || []);

    var reviewHtml = `<div style="text-align:right; max-width:700px; margin:20px auto; padding:20px; background:#fff; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="text-align:center; color:var(--primary); margin-top:0;">نتيجة الاختبار</h2>
        <div style="font-size:1.6rem; font-weight:900; color:#16a34a; background:#dcfce7; padding:15px; border-radius:12px; text-align:center; margin:15px 0;">
            درجتك النهائية: ${gradeText}
        </div>
        <p style="text-align:center; color:#64748b; font-size:0.95rem; margin-bottom:20px;">استعراض إجابات الأسئلة ومراجعة الأخطاء والصواب:</p>
        <hr style="margin-bottom:20px;">`;

    if (questionsList.length > 0) {
        questionsList.forEach((q, qIndex) => {
            let stdAns = myAnswers['q_' + qIndex] || 'لم يجب';
            let correctAns = (q.options && q.options.length > 0) ? q.options[0] : '';
            let isCorrect = (stdAns === correctAns && stdAns !== 'لم يجب');
            let boxBg = isCorrect ? '#f0fdf4' : '#fef2f2';
            let boxBorder = isCorrect ? '#bbf7d0' : '#fecaca';
            let badgeText = isCorrect ? '<span style="color:#16a34a; font-weight:bold;">إجابتك صحيحة ✓</span>' : '<span style="color:#dc2626; font-weight:bold;">إجابتك خاطئة ✗</span>';

            reviewHtml += `<div style="background:${boxBg}; padding:20px; margin:15px 0; border-radius:12px; border:1.5px solid ${boxBorder};">
                <p style="font-weight:800; color:#1e293b; margin-bottom:5px;">السؤال رقم ${qIndex + 1}</p>
                <div style="width:100%; min-height:45px; padding:12px 14px; border-radius:8px; border:1.5px solid var(--border-color); background-color:#f8fafc; color:#0f172a; font-weight:750; margin-bottom:15px; white-space:pre-wrap; word-break:break-word;">${q.question || ''}</div>`;
            
            if (q.options && q.options.length > 0) {
                q.options.forEach((opt, oIndex) => {
                    if (opt) {
                        let isSelected = (stdAns === opt);
                        let optStyle = isSelected ? 'border-color:#2563eb; background:#eff6ff; font-weight:800;' : 'background:#ffffff;';
                        
                        reviewHtml += `<div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; margin:8px 0; border-radius:8px; border:1.5px solid #cbd5e1; ${optStyle}">
                            <div style="display:flex; align-items:center;">
                                <span style="font-size:1.1rem; margin-left:10px; font-weight:800; color:#4338ca;">${numbers[oIndex] || ''}</span>
                                <span>${opt} ${isSelected ? '(اختيارك)' : ''}</span>
                            </div>
                        </div>`;
                    }
                });
            }

            reviewHtml += `<p style="margin:10px 0 0 0; font-size:0.95rem; font-weight:bold;">حالة الإجابة: [ ${badgeText} ]</p>`;
            
            if (!isCorrect) {
                reviewHtml += `<p style="margin:6px 0 0 0; font-size:0.95rem; color:#16a34a; font-weight:bold;">الإجابة الصحيحة النموذجية: ${correctAns}</p>`;
            }

            reviewHtml += `</div>`;
        });
    }

    reviewHtml += `<br>
        <button class="desine-btn" style="width:100%; background:#0f172a; padding:14px; font-size:1.1rem;" onclick="closeFullReviewAndGoHome()">
            <i class="fas fa-times-circle"></i> إغلاق ومغادرة استعراض الاختبار
        </button>
    </div>`;

    $('.my_pages > div').addClass('Dnone');
    
    if ($('#page_full_review').length === 0) {
        $('.my_pages').append(`<div id="page_full_review"></div>`);
    }
    $('#page_full_review').html(reviewHtml).removeClass('Dnone');
    window.scrollTo(0, 0);
}

function closeFullReviewAndGoHome() {
    $('#page_full_review').addClass('Dnone');
    go_page('page_home');
}
