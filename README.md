# KRFT Dashboard

한국 주식 종목의 **기준일 종가 대비 수익률**을 비교하는 정적 웹 앱입니다.

- **Repository**: https://github.com/powerpower2005/krft-dashboard
- **배포 URL**: https://powerpower2005.github.io/krft-dashboard/
- **시세 데이터**: pykrx / FinanceDataReader — GitHub Actions에서 생성
- **프론트**: GitHub Pages — JSON 파일만 읽음

## 이용 순서

### 1단계: GitHub에 push

```bash
git clone https://github.com/powerpower2005/krft-dashboard.git
cd krft-dashboard
```

### 2단계: GitHub 설정 (최초 1회)

1. **Settings → Pages → Build and deployment** → Source: **GitHub Actions**
2. **Settings → Actions → General → Workflow permissions** → **Read and write**

### 3단계: Deploy 완료 확인

- **Actions** → **Deploy to GitHub Pages** 초록색 체크
- https://powerpower2005.github.io/krft-dashboard/ 접속

### 4단계: Backfill OHLCV (최초 1회)

1. **Actions** → **Backfill OHLCV** → **Run workflow**
2. 완료 후 `ohlcv/*.json` commit 및 재배포 대기

### 5단계: 사용

1. 닉네임 + 종목명/코드 + 기준일 입력 → **추가**
2. 수익률 테이블 확인 (10분마다 `quotes.json` 자동 갱신)

## 아키텍처

```
GitHub Actions (Python: pykrx, FinanceDataReader)
  ├─ stocks.json
  ├─ quotes.json
  └─ ohlcv/{code}.json

GitHub Pages (React) + localStorage
```

## 로컬 실행

```bash
pip install -r requirements.txt
set PYTHONPATH=scripts
python scripts/generate_stocks.py
python scripts/fetch_quotes.py
python scripts/generate_ohlcv.py --code 005930 --years 10

npm install
npm run dev
```

## GitHub Actions

| Workflow | 트리거 | 역할 |
|----------|--------|------|
| CI | push/PR | lint, typecheck, build |
| Deploy | push main | Pages 배포 |
| Preview | PR | PR 미리보기 |
| Refresh quotes | 10분 (장중) | quotes.json 갱신 |
| Refresh stocks | 평일 06:00 KST | stocks.json 갱신 |
| Backfill OHLCV | 수동 | ohlcv 전 종목 생성 |
| Refresh OHLCV (daily) | 평일 | ohlcv 최신 종가 append |
| Redeploy on data change | data push | JSON 변경 시 재배포 |

## Python scripts

| Script | 출력 |
|--------|------|
| `scripts/generate_stocks.py` | `public/stocks.json` |
| `scripts/fetch_quotes.py` | `public/quotes.json` |
| `scripts/generate_ohlcv.py` | `public/ohlcv/{code}.json` |

## npm scripts

| Script | 설명 |
|--------|------|
| `npm run dev` | 로컬 개발 |
| `npm run build` | 프론트 빌드 |
| `npm run lint` / `typecheck` | CI와 동일 |
