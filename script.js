var loginState = localStorage.getItem('loginState') || '';
var loginEmail = localStorage.getItem('loginEmail') || '';
var mode_te_st = localStorage.getItem('mode_te_st') || 'student';
var goToCreateExam = '';
var questionCount = 0;
var currentEditingQuestionId = null;

function PassStart() {
    if ($('#Pass_start_ckeck').is(':checked')) {
        $('#input_Pass').show();
    } else {
        $('#input_Pass').hide();
    }
}

function TimeTest() {
    if ($('#Time_test_ckeck').is(':checked')) {
        $('#input_Time').show();
    } else {
        $('#input_Time').hide();
    }
}

function Bank_Test() {
    if ($('#Bank_test_ckeck').is(':checked')) {
        $('#input_Bank').show();
    } else {
        $('#input_Bank').hide();
    }
}

function RandomAskk() {}
function Wifitest() {}
function OUTtest() {}
function CAPtest() {}

function kind_download_direct() {}
function kind_download_indexedDB() {}

function close_Bar1() {}
function close_Bar2() {}

function show_AnserSS() {}
function allow_showw() {}

function direction_ask1() {
    $('.inputAsk, .inputAns').attr('dir', 'rtl');
}

function direction_ask2() {
    $('.inputAsk, .inputAns').attr('dir', 'ltr');
}

// ===== نافذة تعديل السؤال =====
function showEditQuestionModal(questionId) {
    var box = $(`.question_box[data-id="${questionId}"]`);
    if (!box.length) return;

    currentEditingQuestionId = questionId;

    var questionText = box.find('.inputAsk').val() || '';
    var options = [];
    box.find('.inputAns').each(function() {
        options.push($(this).val() || '');
    });

    var correctIndex = box.find('input[type="radio"]:checked').val() || 0;

    var html = `
        <div id="editQuestionModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; display:flex; align-items:center; justify-content:center;">
            <div style="background:#fff; padding:25px; border-radius:16px; width:95%; max-width:550px; max-height:90vh; overflow-y:auto; text-align:right; box-shadow:0 25px 50px rgba(0,0,0,0.3);">
                <h3 style="color:var(--primary); text-align:center; margin-top:0;"><i class="fas fa-edit"></i> تعديل السؤال</h3>
                <hr>
                <label style="display:block; font-weight:800; margin:10px 0 5px 0;">نص السؤال:</label>
                <textarea id="edit_question_text" class="inputMyApp" style="width:100%; height:80px; resize:vertical; text-align:right;">${escapeHtml(questionText)}</textarea>

                <label style="display:block; font-weight:800; margin:10px 0 5px 0;">الخيارات:</label>
                <div id="edit_options_container">
    `;

    var numbers = ['❶', '❷', '❸', '❹'];
    for (var i = 0; i < 4; i++) {
        var checked = (i == correctIndex) ? 'checked' : '';
        html += `
            <div style="display:flex; align-items:center; gap:8px; margin:6px 0; padding:6px 10px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                <span style="font-weight:900; color:var(--primary); font-size:1.1rem; min-width:28px;">${numbers[i]}</span>
                <input type="text" class="inputMyApp edit_option_input" value="${escapeHtml(options[i] || '')}" placeholder="الخيار ${i+1}" style="width:100%; margin:0; border:none; background:transparent; text-align:right; font-size:0.95rem; padding:4px 0;">
                <input type="radio" name="edit_correct_option" value="${i}" ${checked} style="width:20px; height:20px; cursor:pointer; flex-shrink:0;">
            </div>
        `;
    }

    html += `
                </div>
                <div style="display:flex; gap:10px; margin-top:20px; justify-content:center;">
                    <button class="desine-btn" onclick="saveQuestionEdit()" style="background:#10b981; display:inline-block; margin:0; padding:10px 30px;"><i class="fas fa-save"></i> حفظ التعديلات</button>
                    <button class="desine-btn" onclick="closeEditModal()" style="background:#64748b; display:inline-block; margin:0; padding:10px 30px;"><i class="fas fa-times"></i> إلغاء</button>
                </div>
            </div>
        </div>
    `;

    // إزالة أي نافذة سابقة
    $('#editQuestionModal').remove();
    $('body').append(html);
}

function closeEditModal() {
    $('#editQuestionModal').remove();
    currentEditingQuestionId = null;
}

function saveQuestionEdit() {
    var questionId = currentEditingQuestionId;
    if (!questionId) {
        alert('خطأ: لم يتم تحديد السؤال');
        return;
    }

    var box = $(`.question_box[data-id="${questionId}"]`);
    if (!box.length) {
        alert('لم يتم العثور على السؤال');
        return;
    }

    var newText = $('#edit_question_text').val().trim();
    if (!newText) {
        alert('الرجاء إدخال نص السؤال');
        return;
    }

    var newOptions = [];
    $('.edit_option_input').each(function() {
        var val = $(this).val().trim();
        newOptions.push(val || '');
    });

    var correctIndex = $('input[name="edit_correct_option"]:checked').val();
    if (correctIndex === undefined || correctIndex === null) {
        alert('الرجاء تحديد الإجابة الصحيحة');
        return;
    }
    correctIndex = parseInt(correctIndex);

    // تحديث السؤال
    box.find('.inputAsk').val(newText);

    var optionInputs = box.find('.inputAns');
    optionInputs.each(function(idx) {
        $(this).val(newOptions[idx] || '');
    });

    // تحديث الراديو
    box.find('input[type="radio"]').each(function(idx) {
        $(this).prop('checked', idx === correctIndex);
    });

    alert('تم تحديث السؤال بنجاح!');
    closeEditModal();
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===== إضافة سؤال جديد (مع أزرار التعديل والحذف) =====
function add_ask() {
    questionCount++;
    var qId = questionCount;
    var numbers = ['❶', '❷', '❸', '❹'];
    
    var html = `<div class="question_box" data-id="${qId}" style="background:#fff; padding:20px; margin:15px auto; width:92%; border-radius:12px; border:1.5px solid var(--border-color); text-align:right; position:relative; transition:all 0.3s ease;">
        
        <!-- رأس السؤال مع أزرار التحكم -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:8px; border-bottom:1.5px dashed #e2e8f0;">
            <p style="font-weight:800; color:var(--text-main); font-size:1.05rem; margin:0;">
                <i class="fas fa-question-circle" style="color:var(--primary); margin-left:8px;"></i>
                السؤال رقم ${qId}
            </p>
            <div style="display:flex; gap:6px; align-items:center;">
                <button type="button" onclick="showEditQuestionModal(${qId})" style="background:#0284c7; color:#fff; border:none; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:800; cursor:pointer; transition:0.2s; display:flex; align-items:center; gap:4px;" onmouseover="this.style.background='#0369a1'" onmouseout="this.style.background='#0284c7'">
                    <i class="fas fa-pen"></i> تعديل
                </button>
                <button type="button" onclick="deleteSingleQuestion(${qId})" style="background:#ef4444; color:#fff; border:none; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:800; cursor:pointer; transition:0.2s; display:flex; align-items:center; gap:4px;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
        
        <textarea class="inputAsk inputAskAuto" placeholder="ادخل نص السؤال هنا..."></textarea><br>
        <p style="font-size:0.9rem; color:var(--text-muted); margin:6px 0;">الخيارات:</p>`;
    
    for (var i = 0; i < 4; i++) {
        let isChecked = (i === 0) ? 'checked' : '';
        html += `<div style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:8px 12px; margin:8px 0; border-radius:8px; border:1.5px solid #cbd5e1;">
            <div style="display:flex; align-items:center; width:90%;">
                <span style="font-size:1.1rem; margin-left:10px; font-weight:800; color:#4338ca;">${numbers[i]}</span>
                <input type="text" class="inputMyApp inputAns" placeholder="الخيار ${i+1}" style="width:100%; margin:0; border:none; background:transparent; text-align:right;">
            </div>
            <input type="radio" name="correct_${qId}" value="${i}" ${isChecked} style="width:20px; height:20px; cursor:pointer;" title="حدد الإجابة الصحيحة">
        </div>`;
    }

    html += `</div>`;
    $('#form_new_ask').append(html);
}

// ===== حذف سؤال فردي =====
function deleteSingleQuestion(questionId) {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال نهائياً؟')) return;

    var box = $(`.question_box[data-id="${questionId}"]`);
    if (box.length) {
        // تأثير انزلاقي احترافي قبل الحذف
        box.css({
            'transition': 'all 0.4s ease',
            'opacity': '0',
            'transform': 'translateX(-30px)'
        });
        setTimeout(function() {
            box.remove();
            // إعادة ترقيم الأسئلة المتبقية
            renumberQuestions();
        }, 400);
    }
}

// ===== إعادة ترقيم الأسئلة بعد الحذف =====
function renumberQuestions() {
    var boxes = $('#form_new_ask .question_box');
    boxes.each(function(index) {
        var newId = index + 1;
        $(this).attr('data-id', newId);
        
        // تحديث رقم السؤال في النص
        $(this).find('p:first').html('<i class="fas fa-question-circle" style="color:var(--primary); margin-left:8px;"></i> السؤال رقم ' + newId);
        
        // تحديث أزرار التعديل والحذف
        var btns = $(this).find('.question_box > div:first-child .btn-group');
        if (btns.length) {
            btns.html(`
                <button type="button" onclick="showEditQuestionModal(${newId})" style="background:#0284c7; color:#fff; border:none; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:800; cursor:pointer; transition:0.2s; display:flex; align-items:center; gap:4px;" onmouseover="this.style.background='#0369a1'" onmouseout="this.style.background='#0284c7'">
                    <i class="fas fa-pen"></i> تعديل
                </button>
                <button type="button" onclick="deleteSingleQuestion(${newId})" style="background:#ef4444; color:#fff; border:none; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:800; cursor:pointer; transition:0.2s; display:flex; align-items:center; gap:4px;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                    <i class="fas fa-trash"></i> حذف
                </button>
            `);
        }
        
        // تحديث اسم الراديو
        $(this).find('input[type="radio"]').each(function() {
            var name = $(this).attr('name');
            if (name) {
                var newName = name.replace(/correct_\d+/, 'correct_' + newId);
                $(this).attr('name', newName);
            }
        });
    });
    
    // تحديث العداد
    questionCount = boxes.length;
}

// ===== حذف آخر سؤال (تبقى للتوافق مع الزر القديم) =====
function delete_ask() {
    var boxes = $('#form_new_ask .question_box');
    if (boxes.length === 0) {
        alert('لا توجد أسئلة لحذفها');
        return;
    }
    var lastBox = boxes.last();
    var lastId = lastBox.data('id');
    deleteSingleQuestion(lastId);
}

function info_how_add_ask() {
    alert('يمكنك إضافة الأسئلة مباشرة عبر التطبيق. استخدم زر "تعديل" لتعديل سؤال موجود، وزر "حذف" لإزالة سؤال.');
}

function info_bank() {
    alert('بنك الأسئلة يسمح بتوليد عدد عشوائي من الأسئلة.');
}

function info_Wifi_test() {
    alert('تنبيه: هذا الخيار يمنع الطالب من تصفح الإنترنت.');
}

function info_direct_radio() {
    alert('التحميل والبدء مباشرة دون الحاجة للحفظ المؤقت.');
}

function info_radio_indexedDB() {
    alert('تحميل الاختبار وحفظه للبدء في وقت لاحق.');
}

function info_barcode_radio() {
    alert('اعتماد الإجابات بواسطة الرمز الشريطي.');
}

$(document).ready(function() {
    PassStart();
    TimeTest();
    Bank_Test();
    
    $('#form_new_ask').html('');
    questionCount = 0;

    if (loginState === 'login=OK') {
        $('#loginEmail').text(loginEmail);
    }
});
