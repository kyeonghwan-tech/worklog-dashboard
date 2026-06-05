# 신지원 업무일지 대시보드 - 배포 가이드

## 배포 전 준비사항

### 1. Vercel Postgres 데이터베이스 생성

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. **Storage** → **Create Database** → **Postgres** 선택
3. 데이터베이스 생성 후 **Connection String** 복사

### 2. GitHub 저장소 생성 및 코드 업로드

```bash
cd worklog-dashboard
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/worklog-dashboard.git
git push -u origin main
```

### 3. Vercel 프로젝트 연결

1. Vercel Dashboard에서 **Add New Project**
2. GitHub 저장소 선택
3. **Environment Variables** 설정:

| 변수명 | 값 |
|---|---|
| `DATABASE_URL` | Vercel Postgres connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` 실행 결과 |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `CRON_SECRET` | 임의의 비밀 문자열 |

4. **Deploy** 클릭

### 4. 데이터베이스 마이그레이션 및 초기 관리자 계정 생성

배포 완료 후 로컬에서 실행:

```bash
# .env.local 파일에 Vercel Postgres DATABASE_URL 설정 후

# DB 마이그레이션 (최초 1회)
npx prisma migrate deploy

# 관리자 계정 생성
npm run db:seed
```

초기 관리자 계정:
- **이메일**: admin@hanbit.co.kr  
- **비밀번호**: hanbit1234!  
- ⚠️ 로그인 후 즉시 비밀번호 변경 필요

### 5. 크론 알림 설정 확인

`vercel.json`의 크론 설정 (평일 오후 5시 KST = UTC 8시):
```json
{
  "crons": [{ "path": "/api/cron/check-logs", "schedule": "0 8 * * 1-5" }]
}
```

Vercel Pro 플랜에서 크론 기능이 활성화됩니다.  
무료 플랜은 수동 호출만 가능합니다.

## 팀원 추가 방법

1. 팀장(ADMIN) 계정으로 로그인
2. 사이드바 **팀원 관리** 클릭
3. **+ 팀원 추가** 버튼으로 이름/이메일/초기 비밀번호 입력
4. 팀원에게 이메일과 초기 비밀번호 공유

팀원은 첫 로그인 후 **내 정보** 페이지에서 비밀번호 변경 가능

## 주요 기능

| 기능 | 팀원 | 팀장 |
|---|:---:|:---:|
| 업무일지 작성/수정 | ✅ | ✅ |
| 내 일지 열람 | ✅ | ✅ |
| 팀 전체 일지 열람 | ✅ | ✅ |
| 댓글 작성 | ✅ | ✅ |
| 부재 신청 (본인) | ✅ | ✅ |
| 팀원 부재 설정 | ❌ | ✅ |
| 팀원 계정 관리 | ❌ | ✅ |
| 미작성 알림 수신 | ✅ | ✅ |
