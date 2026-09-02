function go_page(pageId) {
    $('.my_pages > div').addClass('Dnone');
    $('#' + pageId).removeClass('Dnone');
    
    // إخفاء أو إظهار شريط التنقل السفلي حسب الصفحة
    if (pageId === 'page_mytest') {
        $('#nav-bottom').hide();
    } else {
        $('#nav-bottom').show();
    }

    // تحديث البيانات تلقائياً عند الانتقال لصفحة الاختباراتي
    if (pageId === 'prev_exam') {
        readAll_ans_saveded_new();
        if (typeof readAll_exam_saveded_new === 'function' && loginState === 'login=OK') {
            readAll_exam_saveded_new('update');
        }
    }
}

function backToPrev_page() {
    if (confirm('هل أنت متأكد من الخروج من الاختبار؟ سيتم فقدان تقدمك.')) {
        go_page('page_home');
        $('#Tasleem').addClass('Dnone');
        $('#Takeed').removeClass('Dnone');
    }
}

function chaneg_check_mode(mode) {
    mode_te_st = mode;
    localStorage['mode_te_st'] = mode;
    if (mode === 'teacher') {
        $('.teacher').show();
        $('.student').hide();
        go_page('prev_exam');
    } else {
        $('.teacher').hide();
        $('.student').show();
        go_page('page_home');
    }
}

function chaneg_check_mode_app_lan(lan) {
    localStorage['app_lan'] = lan;
    app_lan = lan;
    $('.start_mode').css('display', 'flex');
}
