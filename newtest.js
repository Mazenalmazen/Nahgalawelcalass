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
            
            var correctIndex = $(this).find('input[type="radio"]:checked').val() || 0;
            var cIndex = parseInt(correctIndex);
            if (cIndex > 0 && options[cIndex]) {
                var temp = options[0];
                options[0] = options[cIndex];
                options[cIndex] = temp;
            }

            questions.push({
                question: q_text.trim(),
                options: options
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

// ===== تحميل الاختبار للتعديل (مع دعم الأزرار الجديدة) =====
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
                    // استخدام add_ask من script.js مع الأزرار الجديدة
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
                    // تعيين الراديو الصحيح (بعد إعادة الترتيب في add_ask، الخيار الصحيح أصبح في index 0)
                    // نحتاج إلى إعادة تعيين الراديو حسب البيانات المحفوظة
                    // لكن add_ask يضع الراديو الأول كـ checked بشكل افتراضي
                    // لذلك نضبط الراديو الصحيح بناءً على الخيارات
                    if (q.options && q.options.length > 0) {
                        // في add_ask، الراديو الأول هو المحدد افتراضياً
                        // نحتاج إلى معرفة أي خيار كان صحيحاً في البيانات الأصلية
                        // نبحث عن الخيار الصحيح في البيانات
                        // بما أننا لا نحفظ correctIndex مباشرة، نستخدم المنطق القديم
                        // في get_exam_data، يتم ترتيب الخيارات بحيث يكون الخيار الصحيح في index 0
                        // لذلك كل الخيارات في index 0 هي الصحيحة
                        // نتحقق إذا كان هناك خيار في index 0
                        if (q.options[0]) {
                            // الراديو الأول هو الصحيح (الافتراضي)
                            // نتركه كما هو
                        }
                    }
                });
            }
            go_page('page_newtest');
            $('#btnAddExam').text('تحديث وحفظ التعديلات');
        });
}
