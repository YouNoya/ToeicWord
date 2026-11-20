# 단어 한 칸 · TOEIC Day 1–30

영단어의 한국어 뜻을 직접 적는 개인 학습 사이트입니다. 제공된 PDF에서 Day 1–30의 단어와 표현 **2,082개**를 추출했습니다. 원본 PDF와 비밀번호는 포함하지 않습니다.

## 바로 사용하기

프로젝트 폴더의 **index.html을 더블클릭**하면 인터넷이나 설치 없이 사용할 수 있습니다. HTML/CSS/JavaScript와 단어 데이터가 이 파일에 모두 들어 있습니다.

- 시험지 선택창에서 Day 1–30 또는 저장한 나만의 시험지를 선택하세요.
- 뜻을 입력하면 현재 브라우저에 자동 저장됩니다.
- 확인 버튼으로 참고 뜻을 펼치고, 맞았어요 / 다시 복습으로 직접 채점하세요.
- 순서 섞기, 복습할 단어 필터, 빈 문제지 인쇄를 사용할 수 있습니다.

## 나만의 시험지 만들기

**나만의 시험지 만들기**를 누르고 단어를 붙여 넣은 뒤 **시험지 만들기**를 누르세요. 이름은 자동 입력되며 바꿀 수 있습니다.

```text
resume
take advantage of
fatigue
apple 사과
```

한 줄에 한 단어·표현을 넣으세요. 영어만 입력하는 줄은 `resume, fatigue; public library`처럼 구분해도 됩니다. 여러 단어로 된 영어 표현은 공백으로 나누지 않습니다. 대소문자만 다른 중복은 한 번만 넣습니다.

PDF에 있는 단어는 모든 Day에서 찾은 참고 뜻을 연결합니다. PDF에 없는 단어도 빈칸 시험지로 생성됩니다. 참고 뜻이 필요하면 `apple 사과`처럼 뜻을 함께 입력하세요. 외부 번역 API는 사용하지 않습니다.

나만의 시험지와 답안은 현재 브라우저에 저장됩니다. 브라우저 데이터 삭제 전이나 다른 기기로 이동할 때 **시험지·답안 백업**으로 JSON 파일을 저장하고 **백업 불러오기**로 복원하세요. 예전 Day 1–4 답안 백업도 불러올 수 있습니다. 웹 사이트와 로컬 HTML 파일의 저장 공간은 서로 다르므로 백업으로 이동하세요.

## 코드 구조

- `dist/index.html`, `style.css`, `app.js`: 웹 화면과 동작
- `dist/model.js`: 답안·시험지 저장 모델과 붙여넣기 해석
- `data/words.json`: 원본 번호를 유지한 30일 단어 데이터
- `dist/words.js`: 브라우저용 단어 데이터
- `scripts/extract_words.py`: 텍스트 추출 결과를 단어 JSON으로 변환
- `scripts/prepare_site.py`: 단어 JavaScript와 단일 실행용 HTML 생성
- `tests/`: 모델·추출 테스트 및 브라우저 회귀 테스트

Day 12의 TEST 페이지에만 있는 4개 단어는 다른 Day의 PDF 본문에서 뜻을 가져왔습니다. 뜻이 여러 개면 참고 뜻을 보고 직접 판단하세요.

## 개발·검증

화면 실행에는 별도 패키지가 필요하지 않습니다. Node.js로 모델 테스트, Python 3으로 추출 테스트를 실행할 수 있습니다.

```text
node --test tests/model.test.cjs
python -m unittest discover -s tests -p "test_*.py"
python scripts/prepare_site.py
python -m http.server 8766 --directory dist
```

브라우저 미리보기 주소는 `http://localhost:8766`입니다. 추출 테스트용 텍스트는 `tests/fixtures/day1-30-source.txt`에 포함되어 있습니다. PDF를 다시 읽을 때만 pypdf가 필요하며 비밀번호는 코드나 설정에 저장하지 않습니다.

## GitHub 공개용 구성

개인 Sites 연결 설정은 공개용 폴더에서 제외했습니다. 로컬 실행은 프로젝트 폴더의 index.html을 열면 됩니다. 답안과 나만의 시험지는 브라우저에 저장되며 저장소 파일에 포함되지 않습니다. 답안 백업 파일과 환경 설정 파일은 .gitignore에서 제외합니다.
# ToeicWord
