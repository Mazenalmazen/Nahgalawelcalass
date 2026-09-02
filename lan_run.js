function lan_run() {
	$('#word_splash').html(lan_logo);
	$('#title_name').html(lan_logo);
	$('#lan_fev_lan').html('اختر اللغة المناسبة لك<br>Choose the language');
	$('#lan_fev_use').html(lan_fev_use);
	$('#lan_word_student').html(lan_word_student);
	$('#lan_word_teacher').html(lan_word_teacher);
	$('#lan_word_ar').html('العربية'); // فقط العربية لأنها ما تظهر
	$('#lan_lan_page').html('<i class="fas fa-language"></i>اللغة - Language'); // فقط العربية لأنها ما تظهر
	$('#lan_search_the_exam_number').html(lan_search_the_exam_number);
	$('#lan_btn_search_the_exam').html(lan_btn_search_the_exam);
	$('#num_exam').attr("placeholder", lan_pl_Enter_the_exam_number);
	$('#lan_page_setting span').html(lan_page_setting);
	$('#lan_page_exams span').html(lan_page_exams);
	$('#lan_page_home span').html(lan_page_home);
	$('#lan_Downloaded_Exams').html(lan_Downloaded_Exams);
	$('#lan_result_search').html(lan_result_search);
	$('#lan_showName').html(lan_showName);
	$('#lan_showNobza').html(lan_showNobza);
	$('#btnDown').html(lan_btnDown);
	$('#lan_btn_back').html(lan_btn_back);

	$('#lan_Create_a_new_Exam').html(lan_Create_a_new_Exam);
	$('#lan_My_Exams_For_Teacher span').html(lan_My_Exams_For_Teacher);
	$('#lan_My_Exams_For_Teacher p').html(lan_update);

	$('#lan_My_Exams_For_Teacher span').html(lan_My_Exams_For_Teacher);
	$('#lan_Name_Exam_tbl_te').html(lan_Name_Exam_tbl_te);
	$('#lan_Number_Exam_tbl_te').html(lan_Number_Exam_tbl_te);
	$('#lan_More_Exam_tbl_te').html(lan_More_Exam_tbl_te);

	$('#lan_My_Exams_For_Student span').html(lan_My_Exams_For_Student);
	$('#lan_Name_Exam_tbl_std').html(lan_Name_Exam_tbl_te); // هنا مأخوذة من قائمة المعلم
	$('#lan_Number_Exam_tbl_std').html(lan_Degree); // هنا مأخوذة من الكلمات العامة
	$('#lan_More_Exam_tbl_std').html(lan_More_Exam_tbl_te); // هنا مأخوذة من قائمة المعلم

	$('#lan_num_exam').html(lan_num_exam);
	$('#lan_showName2').html(lan_showName); // هنا مأخوذة من الصفحة الرئيسية
	$('#lan_showNobza2').html(lan_showNobza); // هنا مأخوذة من الصفحة الرئيسية
	$('#lan_name_std').html(lan_name_std);
	$('#lan_num_std').html(lan_num_std);
	$('#lan_info_std').html(lan_info_std);
	$('#shows_num').attr("placeholder", lan_enter_num_only);
	$('#shows_info').attr("placeholder", lan_optional);
	$('#Takeed').html(lan_btn_finish);
	$('#Tasleem').html(lan_btn_Submit_ans);


	$('#lan_options_add_exam').html(lan_options_add_exam);
	$('#lan_Exam_info').html(lan_Exam_info);
	$('#t_name').attr("placeholder", lan_enter_exam_name);
	$('#t_info').attr("placeholder", lan_enter_exam_info);

	// صفحة إنشاء اختبار جديد
	$('#lan_options_add_exam').html(lan_options_add_exam);
	$('#lan_Exam_info').html(lan_Exam_info);
	$('#lan_enter_exam_name').html(lan_enter_exam_name);
	$('#lan_enter_exam_info').html(lan_enter_exam_info);
	$('#lan_Exam_Options').html(lan_Exam_Options);
	$('#lan_Create_Password_For_Students').html(lan_Create_Password_For_Students);
	$('#lan_t_pass_start').attr("placeholder", lan_t_pass_start);
	$('#lan_No_exam_yet').html(lan_No_exam_yet);
	$('#lan_No_exam_yet_std').html(lan_No_exam_yet_std);

	$('#lan_Timing_Of_Exam_Duration').html(lan_Timing_Of_Exam_Duration);
	$('#lan_Time_test').attr("placeholder", lan_Time_test);
	$('#lan_Bank_test_Option').html(lan_Bank_test_Option);
	$('#Bank_test').attr("placeholder", lan_Bank_test_placeholder);
	$('#lan_Order_Questions').html(lan_Order_Questions);
	$('#lan_security_Options').html(lan_security_Options);
	$('#lan_Internet_Connection').html(lan_Internet_Connection);
	$('#lan_Exiting_Application').html(lan_Exiting_Application);
	$('#lan_Screen_Capture').html(lan_Screen_Capture);
	
	$('#lan_kind_download').html(lan_kind_download);
	$('#lan_kind_download_direct').html(lan_kind_download_direct);
	$('#lan_kind_download_indexedDB').html(lan_kind_download_indexedDB);
	
	$('#lan_Method_Approving_Answers').html(lan_Method_Approving_Answers);
	$('#lan_Automatically').html(lan_Automatically);
	$('#lan_By_Barcode').html(lan_By_Barcode);
	$('#lan_after_Exam_Options').html(lan_after_Exam_Options);
	$('#lan_Show_Degree').html(lan_Show_Degree);
	$('#lan_Show_Correct_Answers').html(lan_Show_Correct_Answers);
	$('#lan_info_Show_Correct_Answers').html(lan_info_Show_Correct_Answers);
	$('#lan_ltr_head').html(lan_ltr_head);
	$('#lan_ltr_info').html(lan_ltr_info);
	$('#lan_rtl').html(lan_rtl);
	$('#lan_ltr').html(lan_ltr);
	$('#lan_word_notes').html(lan_word_notes);
	$('#lan_must_try_exam').html(lan_must_try_exam);
	$('#lan_Add_a_question').html(lan_Add_a_question);
	$('#lan_Delete_a_question').html(lan_Delete_a_question);
	$('#btnAddExam').html(lan_Create_Exam);
	$('#btnEditExam').html(lan_Edit_Exam2);
	$('#lan_10_day').html(lan_10_day);

	$('#xoo').html(lan_Number_minutes_remaining);

	$('#res_by_send').html(lan_res_by_send);
	$('#res_by_num').html(lan_res_by_num);
	$('#res_by_name').html(lan_res_by_name);
	$('#res_by_degree').html(lan_res_by_degree);
	$('#res_by_info').html(lan_res_by_info);
	$('#lan_results_exam').html(lan_results_exam);
	$('#lan_num_res').html(lan_num_res);
	$('#lan_name_res').html(lan_name_res);
	$('#lan_degree_res').html(lan_degree_res);
	$('#lan_save_excel').html(lan_save_excel);
	$('#lan_save_pdf').html(lan_save_pdf);
	$('#lan_delete_result').html(lan_delete_result);

	$('.lan_back_btn').html(lan_btn_back); // لأزرار الرجوع
	$('#lan_about_app').html(lan_about_app);
	$('#lan_about').html(lan_about);
	$('#lan_how_to_use_ved_te').html(lan_how_to_use_ved_te);
	$('#lan_how_to_use_te').html(lan_how_to_use_te);
	$('#lan_how_to_use_te1').html(lan_how_to_use_te1);
	$('#lan_how_to_use_te2').html(lan_how_to_use_te2);
	$('#lan_how_to_use_te3').html(lan_how_to_use_te3);
	$('#lan_how_to_use_ved_std').html(lan_how_to_use_ved_std);
	$('#lan_how_to_use_std').html(lan_how_to_use_std);
	$('#lan_how_to_use_std1').html(lan_how_to_use_std1);
	$('#lan_how_to_use_std2').html(lan_how_to_use_std2);
	$('#lan_how_to_use_std3').html(lan_how_to_use_std3);
	$('#lan_star_app').html(lan_star_app);
	$('#lan_star_app1').html(lan_star_app1);
	$('#lan_star_app2').html(lan_star_app2);
	$('#lan_star_app3').html(lan_star_app3);
	$('#lan_star_app4').html(lan_star_app4);
	$('#how_to_use li').css('direction', lan_step_ul_li); // لتغيير اتجاه الكتابة في ul li
	$('#how_to_use li').css('text-align', lan_step_ul_li2); // لتغيير اتجاه الكتابة في ul li

	$('#lan_lern_pi').html(lan_lern_pi);
	$('#lan_lern_pi1').html(lan_lern_pi1);
	$('#lan_lern_pi2').html(lan_lern_pi2);
	$('#lan_lern_pi3').html(lan_lern_pi3);
	$('#lan_lern_pi4').html(lan_lern_pi4);

	$('#lan_statistics').html(lan_statistics);
	$('#lan_statistics1').html(lan_statistics1);
	$('#lan_statistics2').html(lan_statistics2);
	$('#lan_statistics3').html(lan_statistics3);

	$('#lan_contact_us1').html(lan_contact_us1);
	$('#lan_contact_us2').html(lan_contact_us2);
	$('#lan_contact_us3').html(lan_contact_us3);
	$('#lan_contact_us4').html(lan_contact_us4);
	$('#lan_contact_us5').html(lan_contact_us5);
	$('#lan_contact_us6').html(lan_contact_us6);
	$('#lan_contact_us7').html(lan_contact_us7);

	$('#lan_font1').html(lan_font1);
	$('#lan_font2').html(lan_font2);
	$('#lan_font3').html(lan_font3);
	$('#lan_color1').html(lan_color1);
	$('#lan_color2').html(lan_color2);
	$('#lan_color3').html(lan_color3);
	$('#lan_color4').html(lan_color4);
	$('#lan_color5').html(lan_color5);
	$('#lan_color6').html(lan_color6);
	$('#lan_color7').html(lan_color7);

	$('#lan_how_to_use').html(lan_how_to_use);
	$('#lan_change_mode_te').html(lan_change_mode_te);
	$('#lan_change_mode_std').html(lan_change_mode_std);
	$('#lan_change_shape').html(lan_change_shape);
	$('#lan_learn_pi_page').html(lan_learn_pi_page);
	$('#lan_Statistics_page').html(lan_Statistics_page);
	$('#lan_Frequently_asked_page').html(lan_Frequently_asked_page);
	$('#lan_contact_us_page').html(lan_contact_us_page);

	$('#lan_Frequently_asked_btn1').html(lan_Frequently_asked_btn1);
	$('#lan_Frequently_asked_btn2').html(lan_Frequently_asked_btn2);
	$('#lan_Frequently_asked_btn3').html(lan_Frequently_asked_btn3);
	$('#lan_Frequently_asked_btn4').html(lan_Frequently_asked_btn4);
	$('#lan_Frequently_asked_btn5').html(lan_Frequently_asked_btn5);
	$('#lan_Frequently_asked_btn6').html(lan_Frequently_asked_btn6);
	$('#lan_Frequently_asked_btn7').html(lan_Frequently_asked_btn7);

	$('#Frequently_asked button').css('direction', lan_step_ul_li); // لتغيير اتجاه الكتابة في الأسئلة المتكررة

	$('#lan_One_account').html(lan_One_account);
	$('#lan_account_email').html(lan_account_email);
	$('#lan_account_pass').html(lan_account_pass);
	$('#lan_sign_up').html(lan_sign_up);
	
	
	
	
	$('.lan_Do_Not_Allow_Download').html("<i class='fas fa-unlock-alt'></i>" + lan_Do_Not_Allow_Download);
	$('.lan_Allow_Download').html("<i class='fas fa-unlock-alt'></i>" + lan_Allow_Download);
	$('.lan_Exam_review').html("<i class='fas fa-eye'></i>" + lan_Exam_review);
	
	$('#lan_word_ar').html("العربية");
	$('#lan_word_en').html("English");
	$('#lan_word_fr').html("français");
	$('#lan_word_Urdu').html("اردو");
	$('#lan_word_ros').html("русский");
	$('#lan_word_indo').html("Indonesia");
	$('#lan_word_kaza').html("Қазақ");
	$('#lan_word_bort').html("Português");
	
	$('#lan_Available_on_p').html(lan_Available_on_p);
	
	
	
	
	//#============ لمنع التهكير أو التغيير ==============#
	if (document.URL == 'file:///C:/phonegap/etestExam/www/index.html' || document.URL == 'file:///Users/fahadabed/Desktop/exams/exams/www/index.html'){
		// لا تسوي شي للمبرمج
	}else {
		
		if ($('#title_name').html() != lan_logo || $('#contact_us p:nth-child(9)').html() != lan_contact_us6 || $('#contact_us p:nth-child(10)').html() != lan_contact_us7 || $('#contact_us p:nth-child(11) a').html() != 'f-mabed@hotmail.com' || document.URL == 'http://1998988.000webhostapp.com/'){
			$('body').html(''); 
		} 
		if(( /(ipad|iphone|ipod|android)/i.test(navigator.userAgent) )) {
		} else{
			if (kind_me != "electron"){
				$('body').html('');
			}
		}
	}
	//#============ لمنع التهكير أو التغيير ==============#
}

// ===== خليها هنا في الأخير عشانها ما تشتغل في الأيباد وتوقف البرنامج

if(( /(ipad|iphone|ipod)/i.test(navigator.userAgent) )) {
	deviceManufacturer = "Apple";
} else if(( /(android)/i.test(navigator.userAgent) )) {
	deviceManufacturer = "Android";
} else {
	deviceManufacturer = "no";
}
