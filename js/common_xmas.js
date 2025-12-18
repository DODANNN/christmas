// 질문 목록 배열: 질문을 추가하거나 수정할 때 이 배열만 수정하면 됩니다.
const QNA_LIST = [
    "{name1}{josa1_과와} {name2}{josa2_이가} 쪽지에 적은 소원",
    "{name1}{josa1_과와} {name2}{josa2_이가} 마니또로서 준비한 선물", 
    "선물을 받은 {name1}와 {name2}의 반응",
    "둘이서 함께 보낸 크리스마스는···"
];

function getKoreanPostposition(name, withBatchim, withoutBatchim) {
    if (!name || name.length === 0) {
        return withoutBatchim; // 이름이 없으면 받침 없는 것으로 간주
    }
    
    // 마지막 글자 추출
    const lastChar = name.charCodeAt(name.length - 1);

    // 한글 유니코드 범위 (가: 44032, 힣: 55203)를 벗어나면 받침 없는 것으로 간주
    if (lastChar < 44032 || lastChar > 55203) {
        return withoutBatchim;
    }

    // 종성(받침) 인덱스 계산 (유니코드 공식: (글자코드 - 가) % 28)
    const jongseongIndex = (lastChar - 44032) % 28;

    if (jongseongIndex === 0) {
        // 받침이 없는 경우 (인덱스가 0)
        return withoutBatchim;
    } else {
        // 받침이 있는 경우 (인덱스가 1 이상)
        return withBatchim;
    }
}



function setVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// 초기 실행 + 창 크기 변경 시 재실행
window.addEventListener('load', setVh);
window.addEventListener('resize', setVh);


$(document).ready(function(){
    // 전역 변수 초기화
    let isImageSelected = false;
    let isNameEntered = false;
    let isAanswer = false;
    let isBanswer = false;
    let charaName1;
    let charaName2;
    let questionIndex = 0; // 질문의 인덱스 (0부터 시작)
    const totalQuestions = QNA_LIST.length; // 전체 질문 개수

    // 1. 시작 버튼 클릭
    $('.btn__start').click(function(){
        $('.section__index').addClass('dpn');
        $('.set__chara1').removeClass('dpn');
    });

    // 2. 캐릭터 이미지 업로드
    $('.chara__img').on('click', function () {
        const index = $(this).hasClass('chara__img1') ? 1 : 2;
        $(`.chara__img__input${index}`).click();
    });

    $('.chara__img__input').on('change', function () {
        const file = this.files[0];
        const index = $(this).hasClass('chara__img__input1') ? 1 : 2;

        if (!file || !file.type.startsWith('image/')) {
            alert('이미지 파일을 선택해주세요.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            const $imgContainer = $(`.result__top .chara__img${index}`);
            let $imgTag = $imgContainer.find('img.preview-img');
            $imgTag.attr('src', e.target.result).show();

            $(`.chara__profile .chara__img${index}`).css({
                'background-image': `url(${e.target.result})`,
                'background-size': 'cover',
                'background-position': 'center',
                'background-repeat': 'no-repeat'
            }).find('i').remove();
        };
        reader.readAsDataURL(file);
        isImageSelected = true; // 이미지 선택 여부는 현재 페이지의 input 기준으로 판단
        checkFormCompletion();
    });

    // 3. 캐릭터 이름 입력
    $('.chara__name').on('input', function () {
        const value = $(this).val().trim();
        isNameEntered = value !== '';
        checkFormCompletion();
    });

    // 4. 다음 버튼 (캐릭터 설정 단계)
    $(document).on('click', '.btn__next:not(.btn__progress).on', function () {
        $('.btn__next').removeClass('on');
        
        let currentSection = $(this).parents('section');
        let nextSection = $(this).data('connectsection');

        currentSection.addClass('dpn');
        
        if (nextSection === ".section__qna") {
            // QNA 시작 시 캐릭터 정보 업데이트 및 첫 질문 로드
            charaName1 = $('.chara__name1').val();
            charaName2 = $('.chara__name2').val();
            const userColor1 = $('#hiddenColor1').val() || '#cfcece';
            const userColor2 = $('#hiddenColor2').val() || '#cfcece';
            
            // 이름과 색상 반영
            $('[data-charaname2="A"]').text(charaName1);
            $('[data-charaname2="B"]').text(charaName2);
            $('[data-characolor="A"]').css('--bg-color', userColor1);
            $('[data-characolor="B"]').css('--bg-color', userColor2);

            // 첫 질문 로드
            loadQuestion(questionIndex);
            $('.section__qna').removeClass('dpn');

        } else {
            // 다음 캐릭터 설정 페이지로 이동
            $(nextSection).removeClass('dpn');
            isImageSelected = false;
            isNameEntered = false;
            // 다음 캐릭터 설정 페이지의 완료 여부 재확인
            const nextCharaNum = nextSection.slice(-1);
            const nextName = $(`.chara__name${nextCharaNum}`).val().trim();
            isNameEntered = nextName !== '';
            
            // 이미지 확인은 어려우니 일단 이름만 가지고 완료 처리 상태를 재설정.
            // 이미지가 있다면 true로 간주. (실제 이미지는 파일 리더의 onload에서 처리됨)
            // 간단하게는 버튼을 다시 비활성화하고, 입력/선택 시 다시 활성화하도록 합니다.
            checkFormCompletion();
        }
    });

    // 5. 다음 버튼 (질문/답변 단계 - 진행)
    $(document).on('click', '.btn__progress.on', function () {
        // 현재 답변 저장
        const currentQnaDiv = $('.qna_div.on');
        const answerA = currentQnaDiv.find('.answer__areaA').val();
        const answerB = currentQnaDiv.find('.answer__areaB').val();
        
        // 질문 번호는 인덱스 + 1
        saveAnswerA(questionIndex + 1, answerA);
        saveAnswerB(questionIndex + 1, answerB);

        // 다음 질문으로 이동
        questionIndex++;

        if (questionIndex < totalQuestions) {
            // 다음 질문 로드
            loadQuestion(questionIndex);
            
            // 완료 상태 리셋
            isAanswer = false;
            isBanswer = false;
            $('.btn__progress').removeClass('on');

        } else {
            // 마지막 질문을 완료한 경우: 결과 페이지로 이동
            $('.section__qna').addClass('dpn');

            // ⭐ 이 부분이 추가되었습니다!
            renderResults();
            $('.section__result').removeClass('dpn');
            /*
            // 결과 페이지에 내용 반영 (필요시 추가 로직 구현)
            displayAnswers_A(); // 콘솔 출력
            displayAnswers_B(); // 콘솔 출력*/

        }
    });
    
    // 6. 질문을 로드하는 함수
    function loadQuestion(index) {
        if (index >= 0 && index < totalQuestions) {
            let currentQuestion = QNA_LIST[index];
            const qnaDiv = $('.qna_div');
            
        

            const userColor1 = $('#hiddenColor1').val() || '#cfcece';
            const userColor2 = $('#hiddenColor2').val() || '#cfcece';

            let user1Name = charaName1; // 사용자 1 이름
            let user2Name = charaName2; // 사용자 2 이름

            const josa1_이가 = getKoreanPostposition(charaName1, "이", "가");
            currentQuestion = currentQuestion.replace(/{josa1_이가}/g, josa1_이가);

            const josa2_이가 = getKoreanPostposition(charaName2, "이", "가");
            currentQuestion = currentQuestion.replace(/{josa2_이가}/g, josa2_이가);

            const josa1_과와 = getKoreanPostposition(charaName1, "과", "와");
            currentQuestion = currentQuestion.replace(/{josa1_과와}/g, josa1_과와);

            const josa2_과와 = getKoreanPostposition(charaName2, "과", "와");
            currentQuestion = currentQuestion.replace(/{josa2_과와}/g, josa2_과와);

            const styledName1 = `<span data-characolor2="A">${user1Name}</span>`;
            currentQuestion = currentQuestion.replace(/{name1}/g, styledName1);

            const styledName2 = `<span data-characolor2="B">${user2Name}</span>`;
            currentQuestion = currentQuestion.replace(/{name2}/g, styledName2);

            // 질문 힌트 업데이트
            qnaDiv.find('.question .hint').html(currentQuestion);
            
            // 답변 영역 초기화
            qnaDiv.find('.answer__area').val('');
            qnaDiv.find('[data-characolor2="A"]').css('color', userColor1);
            qnaDiv.find('[data-characolor2="B"]').css('color', userColor2);
            
            // 현재 질문 번호에 따라 버튼 텍스트 변경 (선택 사항)
            // if (index === totalQuestions - 1) {
            //     $('.btn__progress').find('span').text('결과 보기');
            // } else {
            //     $('.btn__progress').find('span').text('다음');
            // }
        }
    }

    // 7. 캐릭터 설정 완료 여부 확인
    function checkFormCompletion() {
        if (isImageSelected && isNameEntered) {
            $('.set__chara:not(.dpn)').find('.btn__next').addClass('on');
        } else {
            $('.set__chara:not(.dpn)').find('.btn__next').removeClass('on');
        }
    }

    // 8. 답변 입력 감지
    $(document).on('input', '.answer__area', function(){
        const chara = $(this).data('answer');
        const hasText = $(this).val().trim().length > 0;

        if (chara === "A") {
            isAanswer = hasText;
        } else if (chara === "B") {
            isBanswer = hasText;
        }
        checkAnswerCompletion();
    });

    // 9. 답변 완료 여부 확인 (두 캐릭터 모두 답변했는지)
    function checkAnswerCompletion() {
        if (isAanswer && isBanswer) {
            $('.btn__progress').addClass('on');
        } else {
            $('.btn__progress').removeClass('on');
        }
    }

    // 10. 컬러 피커 (기존 로직 유지)
    // ... pickr1 생성 로직 ...
    const pickr1 = Pickr.create({
        el: '.color-picker',
        theme: 'classic',
        default: '#cfcece',
        components: { preview: true, hue: true, interaction: { hex: true, input: true, save: true } }
    });
    pickr1.on('change', (color) => {
        const hex = color.toHEXA().toString();
        $('.set__chara1 .pcr-button').css('--pcr-color', hex);
    });
    pickr1.on('hide', () => {
        const hex = pickr1.getColor().toHEXA().toString();
        $('#hiddenColor1').val(hex);
        $('.set__chara1').find('.chara__name').trigger('input'); // 색상 선택 후 다시 활성화 체크
    });

    // ... pickr2 생성 로직 ...
    const pickr2 = Pickr.create({
        el: '.color-picker2',
        theme: 'classic',
        default: '#cfcece',
        components: { preview: true, hue: true, interaction: { hex: true, input: true, save: true } }
    });
    pickr2.on('change', (color) => {
        const hex = color.toHEXA().toString();
        $('.set__chara2 .pcr-button').css('--pcr-color', hex);
    });
    pickr2.on('hide', () => {
        const hex = pickr2.getColor().toHEXA().toString();
        $('#hiddenColor2').val(hex);
        $('.set__chara2').find('.chara__name').trigger('input'); // 색상 선택 후 다시 활성화 체크
    });

    const $targetDiv = $('.section__result');
    $('#captureBtn').click(function() {
        $('#captureBtn').addClass('dpn');
        const initialScrollY = window.scrollY;
        const deviceScale = window.devicePixelRatio > 1 ? window.devicePixelRatio : 2;
        const options = {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#b13535",
            width: $targetDiv.outerWidth(),
            windowWidth: $targetDiv.outerWidth(),
            height: $targetDiv[0].scrollHeight,
            
            // [넙데데 오류 최종 해결책]
            onclone: function(clonedDoc) {
                // 복제된 문서 내부의 Base64 이미지들을 찾아 비율을 강제로 고정
                const $clonedImgs = $(clonedDoc).find('.preview-img');
                $clonedImgs.each(function() {
                    $(this).css({
                        'width': '100px',
                        'height': '100px',
                        'object-fit': 'cover',
                        'min-width': '100px',
                        'max-width': '100px'
                    });
                });
                
                // 버튼이 복제본에 남아있다면 여기서도 확실히 숨김
                $(clonedDoc).find('#captureBtn').hide();
            }
        };

        html2canvas(options.element, options).then(function(canvas) {
            window.scrollTo(0, initialScrollY);
            const imageDataURL = canvas.toDataURL('image/png', 1.0);
            downloadImage(imageDataURL, 'xmas_image.png');
        }).catch(function(error) {
             console.error('HTML2CANVAS 캡처 오류:', error);
             alert('이미지 저장에 실패했습니다.');
        });
    });
});

function downloadImage(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    $('#captureBtn').removeClass('dpn');
}

// 기존 답변 저장 및 출력 함수 (질문 번호는 인덱스 + 1)
let answers_A = {};
let answers_B = {};

function saveAnswerA(questionNumber, answer) {
    // 질문 내용은 QNA_LIST[questionNumber - 1] 에서 가져올 수 있지만,
    // 기존 형식 유지를 위해 간단하게 처리
    answers_A[`question${questionNumber}`] = {
        question: QNA_LIST[questionNumber - 1] || `질문 ${questionNumber}`,
        answer: answer
    };
}
function saveAnswerB(questionNumber, answer) {
    answers_B[`question${questionNumber}`] = {
        question: QNA_LIST[questionNumber - 1] || `질문 ${questionNumber}`,
        answer: answer
    };
}

function displayAnswers_A() {
    for (let key in answers_A) {
        let question = answers_A[key].question.replace(/<br \/>/g, ' '); // 줄바꿈 제거 후 출력
        let answer = answers_A[key].answer;
        //console.log('displayAnswers_A : ' + `${question.trim()}\n답변: ${answer}\n`);
    }
}

function displayAnswers_B() {
    for (let key in answers_B) {
        let question = answers_B[key].question.replace(/<br \/>/g, ' '); // 줄바꿈 제거 후 출력
        let answer = answers_B[key].answer;
        //console.log('displayAnswers_B : ' + `${question.trim()}\n답변: ${answer}\n`);
    }
}

function renderResults() {
    const $resultContent = $('.section__result .section__content');
    $resultContent.find('.result__qna__container').remove(); // 기존 내용 제거

    const charaName1 = $('.chara__name1').val() || 'A';
    const charaName2 = $('.chara__name2').val() || 'B';
    const characolor1 = $('#hiddenColor1').val() || '#DDD';
    const characolor2 = $('#hiddenColor2').val() || '#DDD';
    const totalQuestions = QNA_LIST.length;

    const $qnaContainer = $('<div class="result__qna__container"></div>');


    const plainName1 = charaName1;
    const plainName2 = charaName2;
    const josa1_이가 = getKoreanPostposition(charaName1, "이", "가");
    const josa2_이가 = getKoreanPostposition(charaName2, "이", "가");
    const josa1_과와 = getKoreanPostposition(charaName1, "과", "와");
    const josa2_과와 = getKoreanPostposition(charaName2, "과", "와");

    for (let i = 1; i <= totalQuestions; i++) {
        const questionKey = `question${i}`;
        const dataA = answers_A[questionKey];
        const dataB = answers_B[questionKey];
// 질문 ${i}.
        if (dataA && dataB) {
            let displayQuestion = dataA.question;

            displayQuestion = displayQuestion.replace(/{josa1_이가}/g, josa1_이가);
            displayQuestion = displayQuestion.replace(/{josa2_이가}/g, josa2_이가);
            displayQuestion = displayQuestion.replace(/{josa1_과와}/g, josa1_과와);
            displayQuestion = displayQuestion.replace(/{josa2_과와}/g, josa2_과와);
            
            // 2. 이름 대체 (순수한 이름 텍스트로 대체)
            displayQuestion = displayQuestion.replace(/{name1}/g, plainName1);
            displayQuestion = displayQuestion.replace(/{name2}/g, plainName2);


            // HTML 구조 생성
            const $resultDiv = $(`
                <div class="result__qna__item">
                    <div class="result__question">
                        <p>Q. ${displayQuestion.replace(/<br \/>/g, ' ')}</p>
                    </div>
                    <div class="result__answers">
                        <div class="result__answer result__answer-A">
                            <p class="chara__name chara__name1">${charaName1}</p>
                            <div class="chara__text">${dataA.answer.replace(/\n/g, '<br>')}</div>
                        </div>
                        <div class="result__answer result__answer-B">
                            <p class="chara__name chara__name2">${charaName2}</p>
                            <div class="chara__text">${dataB.answer.replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                </div>
            `);
            $qnaContainer.append($resultDiv);
        }
    }

    $resultContent.append($qnaContainer);
    $('.chara__name1').css('--text-color', characolor1);
    $('.chara__name2').css('--text-color', characolor2);
    $('.content').addClass('result');
    console.log("결과 페이지 렌더링 완료");
}
