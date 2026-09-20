/* ==========================================================================
   المساعد الذكي - منصة نهج الأوائل
   يستخدم Gemini 3.5 Flash-Lite (500 طلب يومياً) مع Fallback تلقائي
   ✅ يعمل مع نسخة المستخدم ونسخة الأدمن معاً
   ========================================================================== */

// ⚙️ إعدادات الذكاء الاصطناعي
const GEMINI_API_KEY = 'AIzaSyBVQf73Wx7Bm1rsGFJzGRVTjqxCKs_Z0RI';

// 🎯 قائمة الموديلات بالترتيب — يتم تجربة الأول، وإذا فشل يُجرّب التالي
const GEMINI_MODELS = [
    'gemini-3.5-flash-lite',    // ✅ الأساسي: 500 طلب يومياً
    'gemini-3.1-flash-lite',    // 🔄 الاحتياطي 1: 500 طلب يومياً
    'gemini-2.5-flash',         // 🔄 الاحتياطي 2: 500 طلب يومياً
    'gemini-2.0-flash-lite'     // 🚨 الاحتياطي 3: 1,500 طلب يومياً
];

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/* ==========================================================================
   الاتصال بـ Gemini (مع Fallback تلقائي بين الموديلات)
   ========================================================================== */
async function callGemini(prompt, forceJson = false) {
    let lastError = null;

    for (const model of GEMINI_MODELS) {
        try {
            console.log(`🔄 محاولة استخدام الموديل: ${model}`);
            
            // تحديد نوع نقطة النهاية حسب الموديل
            const isInteractionsModel = model.includes('3.8');
            
            let url, body;
            
            if (isInteractionsModel) {
                // صيغة Interactions API (للموديل 3.8 فقط)
                url = `${GEMINI_BASE_URL}/interactions?key=${GEMINI_API_KEY}`;
                body = { model: model, input: prompt };
                if (forceJson) {
                    body.response_format = { type: 'text', mime_type: 'application/json' };
                }
            } else {
                // صيغة generateContent القياسية (لبقية الموديلات)
                url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
                body = {
                    contents: [{ parts: [{ text: prompt }] }]
                };
                if (forceJson) {
                    body.generationConfig = { 
                        responseMimeType: 'application/json',
                        temperature: 0.7,
                        maxOutputTokens: 8192
                    };
                }
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || `HTTP ${response.status}`;
                
                // إذا كانت المشكلة في الحد اليومي، جرب الموديل التالي
                if (response.status === 429 || 
                    response.status === 503 ||
                    errMsg.toLowerCase().includes('quota') ||
                    errMsg.toLowerCase().includes('rate limit')) {
                    console.warn(`⚠️ تجاوز الحد في ${model} — تجربة الموديل التالي...`);
                    lastError = new Error(errMsg);
                    continue;
                }
                
                // خطأ آخر — أوقف
                throw new Error(errMsg);
            }

            const data = await response.json();
            
            // استخراج النص حسب نوع الرد
            let text = '';
            
            if (data.output_text) {
                // صيغة Interactions
                text = data.output_text;
            } else if (data.steps && Array.isArray(data.steps)) {
                // صيغة Interactions القديمة
                text = data.steps
                    .filter(s => s.type === 'model_output')
                    .map(s => {
                        if (s.content && Array.isArray(s.content)) {
                            return s.content.filter(c => c.type === 'text').map(c => c.text).join('');
                        }
                        return '';
                    })
                    .filter(Boolean).join('');
            } else if (data.candidates && data.candidates[0]?.content?.parts) {
                // صيغة generateContent القياسية
                text = data.candidates[0].content.parts.map(p => p.text || '').join('');
            }
            
            if (!text) throw new Error('استجابة فارغة من الخادم');
            
            console.log(`✅ نجح الاتصال باستخدام: ${model}`);
            return text;
            
        } catch (e) {
            console.warn(`❌ فشل ${model}:`, e.message);
            lastError = e;
            
            // إذا كان الخطأ ليس متعلقاً بالحد اليومي، أوقف المحاولات
            const errLower = e.message.toLowerCase();
            if (!errLower.includes('quota') && 
                !errLower.includes('429') &&
                !errLower.includes('503') &&
                !errLower.includes('limit') &&
                !errLower.includes('overloaded')) {
                throw e;
            }
        }
    }
    
    throw lastError || new Error('فشلت جميع الموديلات المتاحة');
}

/* ==========================================================================
   استخراج JSON من رد الذكاء الاصطناعي
   ========================================================================== */
function extractJsonFromText(text) {
    if (!text) throw new Error('الرد فارغ');
    
    let cleaned = String(text).trim();
    
    // إزالة Code fences
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    
    // محاولة قراءة JSON مباشرة
    try {
        return JSON.parse(cleaned);
    } catch (e) {}
    
    // محاولة استخراج مصفوفة
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
        try { return JSON.parse(arrayMatch[0]); } catch (e) {}
    }
    
    // محاولة استخراج كائن
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
        try { return JSON.parse(objMatch[0]); } catch (e) {}
    }
    
    throw new Error('تعذر قراءة الأسئلة من رد الذكاء الاصطناعي');
}

/* ==========================================================================
   نافذة المساعد الذكي
   ========================================================================== */
function showAIQuestionHelper() {
    $('#ai_questions_preview').html('');
    $('#ai_text_input').val('');
    $('#ai_convert_btn').prop('disabled', false).html('<i class="fas fa-magic"></i> تحويل إلى أسئلة');
    $('#ai_question_helper_popup').removeClass('Dnone').css('display', 'flex');
}

function closeAIQuestionHelper() {
    $('#ai_question_helper_popup').css('display', 'none').addClass('Dnone');
}

/* ==========================================================================
   تحويل النص إلى أسئلة اختبار
   ========================================================================== */
async function convertTextToQuestions() {
    const text = $('#ai_text_input').val().trim();
    const count = parseInt($('#ai_question_count').val()) || 5;
    const type = $('#ai_question_type').val();

    if (!text || text.length < 20) {
        Swal.fire({
            icon: 'warning',
            title: 'تنبيه',
            text: 'الرجاء إدخال نص كافٍ (20 حرف على الأقل)',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    if (text.length > 25000) {
        Swal.fire({
            icon: 'warning',
            title: 'النص طويل جداً',
            text: 'الرجاء تقصير النص إلى أقل من 25000 حرف',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    let typeInstruction = '';
    if (type === 'mcq') {
        typeInstruction = `كل سؤال يجب أن يكون من نوع "اختيار من متعدد" مع 4 خيارات بالضبط، وخيار واحد صحيح فقط (correctIndex من 0 إلى 3).`;
    } else if (type === 'truefalse') {
        typeInstruction = `كل سؤال يجب أن يكون من نوع "صح/خطأ" مع خيارين فقط: ["صح", "خطأ"]، والإجابة الصحيحة إما 0 (صح) أو 1 (خطأ).`;
    } else {
        typeInstruction = `استخدم مزيجاً متنوعاً: بعض الأسئلة اختيار من متعدد (4 خيارات)، وبعضها صح/خطأ.`;
    }

    const prompt = `أنت مساعد خبير في إنشاء أسئلة الاختبارات التعليمية باللغة العربية الفصحى.

📋 المهمة: حلّل النص التالي وأنشئ منه بالضبط ${count} سؤال اختبار.

📌 التعليمات:
${typeInstruction}
- الأسئلة يجب أن تكون دقيقة علمياً ومستندة إلى النص المعطى فقط.
- تجنب الأسئلة الغامضة أو التي تحتمل أكثر من إجابة.
- نوّع مستوى الصعوبة (سهل، متوسط، صعب).
- اجعل صياغة السؤال واضحة ومباشرة باللغة العربية.
- لا تكرر نفس السؤال بأشكال مختلفة.

📤 صيغة الإخراج المطلوبة (JSON فقط):
[
  {
    "question": "نص السؤال هنا؟",
    "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
    "correctIndex": 0
  }
]

⚠️ مهم: أرجع JSON صالح فقط بدون أي شرح قبل أو بعد.

📚 النص المطلوب تحليله:
"""
${text}
"""`;

    const btn = $('#ai_convert_btn');
    btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> جاري التحويل...');
    $('#ai_questions_preview').html('');

    try {
        const responseText = await callGemini(prompt, true);
        const parsed = extractJsonFromText(responseText);
        let questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('لم يتم توليد أي أسئلة صالحة');
        }

        const validQuestions = [];
        questions.forEach((q) => {
            if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 2) return;
            let ci = parseInt(q.correctIndex);
            if (isNaN(ci) || ci < 0 || ci >= q.options.length) ci = 0;
            validQuestions.push({
                question: String(q.question).trim(),
                options: q.options.map(o => String(o).trim()),
                correctIndex: ci
            });
        });

        if (validQuestions.length === 0) {
            throw new Error('الأسئلة المولّدة غير صالحة');
        }

        // عرض المعاينة
        let preview = `<div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px; padding:10px; margin-bottom:10px;">
            <p style="margin:0; color:#166534; font-weight:800;">
                <i class="fas fa-check-circle"></i> تم توليد ${validQuestions.length} سؤال بنجاح!
            </p>
        </div>`;
        preview += `<div style="max-height:180px; overflow-y:auto; background:#f8fafc; border-radius:10px; padding:10px; font-size:0.85rem;">`;
        validQuestions.forEach((q, i) => {
            preview += `<div style="padding:6px 0; border-bottom:1px solid #e2e8f0;">
                <b>${i + 1}.</b> ${escapeHtmlAI(q.question)}
            </div>`;
        });
        preview += `</div>`;
        $('#ai_questions_preview').html(preview);

        // إضافة الأسئلة مباشرة
        populateQuestionsForm(validQuestions);
        
        setTimeout(() => {
            closeAIQuestionHelper();
            Swal.fire({
                icon: 'success',
                title: 'تم بنجاح',
                text: `تم إضافة ${validQuestions.length} سؤال إلى الاختبار`,
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#4f46e5'
            });
        }, 500);

    } catch (e) {
        console.error('AI Error:', e);
        $('#ai_questions_preview').html(`<div style="background:#fef2f2; border:1.5px solid #fecaca; border-radius:10px; padding:12px;">
            <p style="margin:0; color:#991b1b; font-weight:800;">
                <i class="fas fa-exclamation-triangle"></i> خطأ: ${escapeHtmlAI(e.message)}
            </p>
            <p style="margin:8px 0 0 0; color:#7f1d1d; font-size:0.85rem;">
                💡 حاول مرة أخرى، أو تحقق من اتصالك بالإنترنت.
            </p>
        </div>`);
    } finally {
        btn.prop('disabled', false).html('<i class="fas fa-magic"></i> تحويل إلى أسئلة');
    }
}

/* ==========================================================================
   إضافة الأسئلة إلى نموذج الاختبار
   ========================================================================== */
function populateQuestionsForm(questions) {
    const container = document.getElementById('form_new_ask');
    if (!container) {
        alert('خطأ: لم يتم العثور على حاوية الأسئلة');
        return;
    }

    if (typeof add_ask !== 'function') {
        alert('خطأ: دالة إضافة السؤال غير محملة');
        return;
    }

    let addedCount = 0;

    questions.forEach((q, idx) => {
        try {
            add_ask();
            const boxes = container.querySelectorAll('.question_box');
            const lastBox = boxes[boxes.length - 1];
            
            if (!lastBox) return;

            // ملء نص السؤال
            const questionInput = lastBox.querySelector('.inputAsk');
            if (questionInput) questionInput.value = q.question;

            // ملء الخيارات
            const optionInputs = lastBox.querySelectorAll('.inputAns');
            q.options.forEach((opt, i) => {
                if (optionInputs[i]) optionInputs[i].value = opt;
            });

            // تحديد الإجابة الصحيحة
            const radios = lastBox.querySelectorAll('input[type="radio"]');
            radios.forEach(r => r.checked = false);
            if (radios[q.correctIndex]) radios[q.correctIndex].checked = true;

            addedCount++;
        } catch (err) {
            console.error(`خطأ في السؤال ${idx + 1}:`, err);
        }
    });

    console.log(`✅ تم إضافة ${addedCount} من ${questions.length} سؤال`);

    // التمرير لأول سؤال جديد
    if (addedCount > 0) {
        setTimeout(() => {
            const boxes = container.querySelectorAll('.question_box');
            const firstNew = boxes[boxes.length - addedCount];
            if (firstNew && firstNew.scrollIntoView) {
                firstNew.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 400);
    }
}

/* ==========================================================================
   تحليل النتائج بالذكاء الاصطناعي
   ========================================================================== */
async function analyzeResultsWithAI() {
    if (!window.currentExamResultsCache || window.currentExamResultsCache.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'لا توجد نتائج',
            text: 'لا توجد نتائج طلاب لتحليلها',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    const results = window.currentExamResultsCache;
    const examNumber = window.currentExamNumberForResults;

    // جلب عدد أسئلة الاختبار
    let examTotalQuestions = 0;
    try {
        let { data: examData } = await window._supabase
            .from('exams')
            .select('exam_data')
            .eq('exam_number', examNumber)
            .single();
        if (examData && examData.exam_data && Array.isArray(examData.exam_data.questions)) {
            examTotalQuestions = examData.exam_data.questions.length;
        }
    } catch (e) {
        console.warn('تعذر جلب بيانات الاختبار', e);
    }

    let scores = [];
    results.forEach(res => {
        if (!res.degree) return;
        let obtained = 0, max = 0;
        const degreeStr = String(res.degree).trim();
        
        if (degreeStr.includes('/')) {
            const parts = degreeStr.split('/');
            if (parts.length === 2) {
                obtained = parseFloat(parts[0]);
                max = parseFloat(parts[1]);
            }
        } else {
            obtained = parseFloat(degreeStr);
            max = examTotalQuestions;
        }
        
        if (!isNaN(obtained) && !isNaN(max) && max > 0) {
            scores.push({
                name: res.student_name,
                obtained,
                max,
                percentage: (obtained / max) * 100
            });
        }
    });

    if (scores.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'لا توجد درجات صالحة',
            html: 'اضغط "إعادة حساب النتائج" أولاً لتحديث صيغة الدرجات.',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    const totalStudents = scores.length;
    const avgPercentage = (scores.reduce((s, x) => s + x.percentage, 0) / totalStudents).toFixed(2);
    const highest = scores.reduce((max, s) => s.percentage > max.percentage ? s : max, scores[0]);
    const lowest = scores.reduce((min, s) => s.percentage < min.percentage ? s : min, scores[0]);

    const distribution = {
        excellent: scores.filter(s => s.percentage >= 90).length,
        veryGood: scores.filter(s => s.percentage >= 80 && s.percentage < 90).length,
        good: scores.filter(s => s.percentage >= 70 && s.percentage < 80).length,
        fair: scores.filter(s => s.percentage >= 60 && s.percentage < 70).length,
        weak: scores.filter(s => s.percentage < 60).length
    };

    let examName = window.currentLoadedExam?.exam_name || 'غير محدد';

    const summaryText = `
اسم الاختبار: ${examName}
عدد الطلاب: ${totalStudents}
متوسط النسبة: ${avgPercentage}%
أعلى نسبة: ${highest.name} - ${highest.percentage.toFixed(2)}%
أدنى نسبة: ${lowest.name} - ${lowest.percentage.toFixed(2)}%
توزيع التقديرات:
- ممتاز (90%+): ${distribution.excellent}
- جيد جداً (80-89%): ${distribution.veryGood}
- جيد (70-79%): ${distribution.good}
- مقبول (60-69%): ${distribution.fair}
- ضعيف (أقل من 60%): ${distribution.weak}
`;

    const prompt = `أنت خبير تربوي ومحلل بيانات تعليمية. قم بتحليل نتائج الاختبار التالية واكتب تقريراً موجزاً ومنظماً باللغة العربية يتضمن:

1. ملخص عام للأداء
2. نقاط القوة في أداء الطلاب
3. نقاط الضعف والتحديات
4. توصيات عملية للمعلم لتحسين الأداء
5. ملاحظات إضافية مهمة

📊 البيانات:
${summaryText}`;

    Swal.fire({
        title: 'جاري تحليل النتائج...',
        html: 'يقوم الذكاء الاصطناعي بتحليل أداء الطلاب',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const analysis = await callGemini(prompt);
        const formatted = escapeHtmlAI(analysis).replace(/\n/g, '<br>');

        Swal.fire({
            title: '<i class="fas fa-chart-pie"></i> تحليل النتائج',
            html: `<div style="text-align:right; line-height:1.9; max-height:60vh; overflow-y:auto; padding:10px; background:#f8fafc; border-radius:10px; font-size:0.95rem;">${formatted}</div>`,
            width: '750px',
            confirmButtonText: 'إغلاق',
            confirmButtonColor: '#4f46e5'
        });
    } catch (e) {
        console.error('AI Analysis Error:', e);
        Swal.fire({
            icon: 'error',
            title: 'خطأ في التحليل',
            text: e.message || 'تعذر تحليل النتائج',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#dc2626'
        });
    }
}

/* ==========================================================================
   دالة مساعدة: حماية HTML
   ========================================================================== */
function escapeHtmlAI(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ==========================================================================
   تعريف الدوال عالمياً
   ========================================================================== */
window.callGemini = callGemini;
window.showAIQuestionHelper = showAIQuestionHelper;
window.closeAIQuestionHelper = closeAIQuestionHelper;
window.convertTextToQuestions = convertTextToQuestions;
window.populateQuestionsForm = populateQuestionsForm;
window.analyzeResultsWithAI = analyzeResultsWithAI;

console.log('✅ ai_assistant.js تم تحميله بنجاح');
console.log('🎯 الموديلات المتاحة:', GEMINI_MODELS.join(', '));