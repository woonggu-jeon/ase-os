# **00_CONSTITUTION/CONSTITUTION.md**

Document: CONSTITUTION

Version: 1.0.0

Status: Draft

Owner: ASE-OS Foundation

Layer: Constitution

Last Updated: 2026-07-23

Depends On:

- README.md
- MISSION.md
- VISION.md
- CORE_VALUES.md

Referenced By:

- All Documents

Related ADR:

- None

Related RFC:

- None

# **Purpose**

이 문서는 ASE-OS의 최상위 규범(Constitution)이다.

Constitution은 새로운 지식을 정의하는 문서가 아니라, ASE-OS를 구성하는 핵심 문서들의 관계와 우선순위를 정의하는 문서이다.

모든 하위 문서는 본 문서를 기준으로 작성되고 해석된다.

# **Constitutional Hierarchy**

ASE-OS의 최상위 계층은 다음과 같은 우선순위를 가진다.

1. Constitution
2. Mission
3. Vision
4. Core Values
5. Engineering Standards
6. Knowledge
7. Governance
8. Execution

상위 문서는 하위 문서보다 우선한다.

하위 문서는 상위 문서를 재정의할 수 없다.

# **Constitutional Documents**

Constitution Layer는 다음 문서로 구성된다.

| **Document** | **Responsibility** |
| --- | --- |
| README | Constitution Layer 안내 |
| MISSION | 존재 목적 정의 |
| VISION | 미래 상태 정의 |
| CORE_VALUES | 모든 의사결정의 기준 |
| CONSTITUTION | 최상위 규범과 문서 관계 정의 |

# **Authority**

Constitution은 다음 사항에 대한 최종 기준이 된다.

- 문서 구조
- 가치 충돌
- 우선순위 판단
- 장기 방향성
- 운영 철학

# **Interpretation Rules**

문서 간 충돌이 발생하면 다음 순서로 판단한다.

1. Constitution
2. Mission
3. Vision
4. Core Values
5. 관련 문서
6. ADR
7. RFC

충돌을 해결할 수 없는 경우 새로운 ADR을 작성하여 기록한다.

# **Amendment Policy**

Constitution은 변경할 수 있다.

단, 다음 절차를 반드시 따른다.

1. 변경 제안(RFC)
2. 영향 분석
3. 공개 검토
4. ADR 승인
5. Version 증가
6. 변경 이력 기록

기존 내용을 삭제하지 않는다.

# **Scope**

Constitution은 다음을 정의한다.

- 존재 목적
- 장기 방향
- 핵심 가치
- 문서 간 관계
- 우선순위
- 해석 원칙

다음은 Constitution의 범위가 아니다.

- 구현 방법
- 기술 선택
- 프로젝트별 정책
- 코딩 규칙
- 아키텍처 상세 설계

이러한 내용은 하위 계층에서 정의한다.

# **Invariants**

다음 원칙은 모든 프로젝트에서 항상 유지되어야 한다.

- Mission은 구현보다 오래 유지된다.
- Vision은 기능보다 오래 유지된다.
- Core Values는 기술보다 오래 유지된다.
- 지식은 코드보다 오래 유지된다.
- 문서는 코드와 동일한 자산이다.

# **Governance**

모든 중요한 변경은 다음 절차를 따른다.

Problem

↓

Analysis

↓

RFC

↓

Review

↓

ADR

↓

Implementation

↓

Verification

↓

Knowledge Update

# **Constitutional Compliance**

모든 문서는 다음 질문에 “예”라고 답해야 한다.

- Mission과 충돌하지 않는가?
- Vision과 일치하는가?
- Core Value를 위반하지 않는가?
- 기존 ADR을 존중하는가?
- 상위 문서를 재정의하지 않는가?

하나라도 “아니오”라면 변경은 보류한다.

# **Success Criteria**

Constitution이 제대로 동작한다면,

- 모든 문서의 우선순위가 명확하다.
- 문서 간 충돌을 해결할 수 있다.
- 새로운 문서를 추가해도 구조가 유지된다.
- AI와 사람이 동일한 기준으로 판단한다.

# **References**

- README.md
- MISSION.md
- VISION.md
- CORE_VALUES.md