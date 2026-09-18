async function login(email, password) {
    if (!email || !password) {
        alert('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }
    
    if (password.length < 4) {
        alert('كلمة المرور قصيرة جداً.');
        return;
    }

    $('#load_login').show();

    try {
        const cleanEmail = email.trim().toLowerCase();
        localStorage.setItem('loginState', 'login=OK');
        localStorage.setItem('loginEmail', cleanEmail);
        localStorage.setItem('teacher_pass_hash', btoa(password));

        alert('تم تسجيل الدخول بنجاح!');
        finalizeLoginSuccess(cleanEmail);
    } catch (err) {
        alert('حدث خطأ أثناء تسجيل الدخول.');
    } finally {
        $('#load_login').hide();
    }
}

function finalizeLoginSuccess(email) {
    window.loginState = 'login=OK';
    window.loginEmail = email;
    $('.popup_login').fadeOut();
    $('#loginEmail').text(email);

    if (typeof readAll_exam_saveded_new === 'function') {
        readAll_exam_saveded_new();
    }
    go_page('prev_exam');
}

// ==================== حفظ / نشر الاختبار ====================
async function get_exam_data() {
    var t_name = $('#t_name').val();
    var t_info = $('#t_info').val();
    var zoomLink = $('#t_zoom_link').val();
    
    if (!t_name) {
        alert('الرجاء إدخال عنوان الاختبار');
        return;
    }

    var teacher_email = localStorage.getItem('loginEmail');
    if (!teacher_email) {
        alert('الرجاء تسجيل الدخول أولاً من الإعدادات');
        go_page('page_setting');
        return;
    }

    var saveBtn = $('#btnAddExam');
    if (saveBtn.prop('disabled')) return;
    saveBtn.prop('disabled', true).css('opacity', '0.6');

    var exam_number = window.editingExamNumber ? window.editingExamNumber : Math.floor(100000 + Math.random() * 900000);

    var settings = {
        pass_start_check: $('#Pass_start_ckeck').is(':checked'),
        t_pass_start: $('#t_pass_start').val(),
        time_test_check: $('#Time_test_ckeck').is(':checked'),
        time_test: $('#Time_test').val(),
        bank_test_check: $('#Bank_test_ckeck').is(':checked'),
        bank_test: $('#Bank_test').val(),
        random_ask: $('#RandomAsk').is(':checked'),
        random_answers: $('#RandomAnswers').is(':checked')
    };

    // ===== بناء قائمة الأسئلة بالترتيب الأصلي مع حفظ مؤشر الإجابة الصحيحة =====
    var questions = [];
    $('.question_box').each(function() {
        var q_text = $(this).find('.inputAsk').val();
        
        if (q_text && q_text.trim() !== '') {
            var options = [];
            $(this).find('.inputAns').each(function() {
                let optVal = $(this).val();
                if (optVal && optVal.trim() !== '') {
                    options.push(optVal.trim());
                }
            });
            
            // الحصول على مؤشر الإجابة الصحيحة من الراديو المحدد
            var correctIndex = $(this).find('input[type="radio"]:checked').val() || 0;
            var cIndex = parseInt(correctIndex);
            // التأكد من أن المؤشر ضمن النطاق
            if (cIndex >= options.length || cIndex < 0) cIndex = 0;

            // ✅ حفظ الخيارات بالترتيب الأصلي تماماً مع مؤشر الإجابة الصحيحة
            questions.push({
                question: q_text.trim(),
                options: options,
                correctIndex: cIndex
            });
        }
    });

    if (questions.length === 0) {
        alert('الرجاء إضافة سؤال واحد على الأقل للاختبار');
        saveBtn.prop('disabled', false).css('opacity', '1');
        return;
    }

    var examDataObject = {
        name: t_name,
        info: t_info,
        questions: questions
    };

    $('#load').show();

    let dbOperation;
    if (window.editingExamNumber) {
        dbOperation = window._supabase
            .from('exams')
            .update({
                exam_name: String(t_name),
                exam_info: String(t_info || ''),
                zoom_link: String(zoomLink || ''),
                exam_data: examDataObject,
                settings: settings
            })
            .eq('exam_number', window.editingExamNumber);
    } else {
        dbOperation = window._supabase
            .from('exams')
            .insert([
                {
                    exam_number: Number(exam_number),
                    teacher_email: String(teacher_email),
                    exam_name: String(t_name),
                    exam_info: String(t_info || ''),
                    zoom_link: String(zoomLink || ''),
                    exam_data: examDataObject,
                    settings: settings
                }
            ]);
    }

    let { data, error } = await dbOperation;
    $('#load').hide();
    saveBtn.prop('disabled', false).css('opacity', '1');

    if (error) {
        alert('خطأ أثناء حفظ الاختبار سحابياً: ' + error.message);
    } else {
        alert('تم إنشاء ونشر الاختبار بنجاح! رقم الاختبار هو: ' + exam_number);
        window.editingExamNumber = null;
        $('#btnAddExam').text('حفظ ونشر الاختبار سحابياً');
        go_page('prev_exam');
        if (typeof readAll_exam_saveded_new === 'function') {
            readAll_exam_saveded_new('update');
        }
    }
}
