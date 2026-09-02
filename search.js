async function search_exam() {
    var num_exam = $('#num_exam').val();
    if (!num_exam) {
        alert('الرجاء إدخال رقم الاختبار');
        return;
    }

    $('#load').show();

    let { data, error } = await window._supabase
        .from('exams')
        .select('*')
        .eq('exam_number', Number(num_exam))
        .single();

    $('#load').hide();

    if (error || !data) {
        alert('لم يتم العثور على الاختبار، تأكد من صحة الرقم.');
        $('#result_search').addClass('Dnone');
        return;
    }

    window.currentLoadedExam = data;

    $('#showName').text(data.exam_name);
    $('#showNobza').text(data.exam_info || 'لا توجد نبذة وصفية');
    $('#show_search').addClass('Dnone');
    $('#result_search').removeClass('Dnone');
}

function show_search() {
    $('#result_search').addClass('Dnone');
    $('#show_search').removeClass('Dnone');
    $('#num_exam').val('');
}

function downloadExam_new() {
    if (!window.currentLoadedExam) {
        alert('الرجاء البحث عن اختبار أولاً');
        return;
    }

    var exam = window.currentLoadedExam;
    
    let savedExams = JSON.parse(localStorage.getItem('downloaded_exams') || '[]');
    let exists = savedExams.some(e => e.exam_number === exam.exam_number);
    
    if (!exists) {
        savedExams.push(exam);
        localStorage.setItem('downloaded_exams', JSON.stringify(savedExams));
    }

    if (typeof readAll_ans_saveded_new === 'function') {
        readAll_ans_saveded_new();
    }

    // فتح وبدء الاختبار فوراً للطالب
    startDownloadedExam(exam.exam_number);
}
