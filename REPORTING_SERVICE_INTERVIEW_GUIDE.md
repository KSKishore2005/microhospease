# Reporting Service — Interview Guide

This is your cheat-sheet for explaining the **reporting-service** module end-to-end. It's structured the way an interviewer typically asks:
**"Tell me about your module"** → **"How does it work?"** → **"Show me the architecture"** → **"What were the challenges?"**

---

## 1. The 30-second Elevator Pitch

> *"I built the **Reporting Service** of HospEase — a hotel management platform built on Spring Boot microservices. It's the analytics and compliance layer: it aggregates data from five other services (Finance, Reservations, Rooms, Service Orders, Users) to produce three things — **Reports** (PDF-downloadable), **KPIs** (occupancy, revenue, collection rate), and **Audit Packages** (regulatory snapshots). It runs on port 8088, uses Feign clients to call peer services, Resilience4j for circuit-breaking and rate-limiting, and exposes a React frontend with charts and downloadable exports."*

If the interviewer asks for **one sentence**: *"It's the read-only analytics service that aggregates data from the other microservices into reports, KPIs, and audit packages."*

---

## 2. Where It Sits in the System

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            React Frontend (port 3000)                     │
│  Reporting Pages: Dashboard · KPIs · Scheduled Reports · Compliance       │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          API Gateway  (port 8765)                         │
│  • Validates JWT once                                                     │
│  • Injects X-Auth-User / X-Auth-Role headers                              │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    REPORTING SERVICE  (port 8088)  ⬅️ MY MODULE            │
│                                                                           │
│   Controllers → Services → Repositories → MySQL (reporting_db)            │
│                     │                                                     │
│                     │ Feign Clients (with fallbacks)                      │
│                     ▼                                                     │
│   ┌──────────────┬──────────────┬──────────────┬──────────────┐         │
│   │   Finance    │ Reservation  │     Room     │   Service    │ User    │
│   │  (8086)      │   (8083)     │   (8082)     │   Order      │ (8084)  │
│   │              │              │              │   (8085)     │         │
│   └──────────────┴──────────────┴──────────────┴──────────────┘         │
└──────────────────────────────────────────────────────────────────────────┘

Service Registry (Eureka, 8761)  · Config Server (8888) · MySQL (3306)
```

**Key Talking Points:**
- "It's a **read-heavy aggregator** — it doesn't own the source data, it consumes from peer services."
- "It registers with **Eureka** so the gateway can route to it dynamically."
- "It pulls **shared config** from the central config-server on port 8888."

---

## 3. The Three Core Domains

The service is organised around three things you can do with it:

### 3.1 Reports
Generated documents (OPERATIONAL / FINANCIAL / OCCUPANCY / REVENUE scope) that aggregate data into a PDF.

- **Entity:** `Report` — stores `reportId`, `reportType`, `scope`, `generatedAt`, `generatedByStaffId`, `contentSummary`, `reportUri`
- **Endpoints:**
  - `GET /api/reports` — list all
  - `GET /api/reports/{id}` — single report
  - `GET /api/reports/scope/{scope}` — filter by scope
  - `POST /api/reports` — create + auto-generate PDF
  - `GET /api/reports/{id}/download` — return PDF as Blob
  - `DELETE /api/reports/{id}` — admin only

### 3.2 KPIs (Key Performance Indicators)
Real-time hotel metrics: **Occupancy rate**, **Revenue per available room (RevPAR)**, **Collection rate**.

- **Entity:** `KPI` — `kpiId`, `name`, `definition`, `target`, `currentValue`, `reportingPeriod`
- **Endpoints:**
  - `GET /api/kpis` — all KPIs
  - `POST /api/kpis/{id}/calculate-occupancy` — recompute occupancy (calls Reservation + Room services)
  - `POST /api/kpis/{id}/calculate-revenue` — recompute revenue (calls Finance service)
  - `POST /api/kpis/{id}/calculate-collection-rate` — recompute collection rate

### 3.3 Audit Packages
Regulatory compliance snapshots — a frozen JSON bundle of all financial/operational data for a date range. Auditors download these.

- **Entity:** `AuditPackage` — `packageId`, `periodStart`, `periodEnd`, `contentsJson` (TEXT column), `packageUri`
- **Endpoints:**
  - `GET /api/audit-packages` — list
  - `POST /api/audit-packages` — create (locks the data for that window)
  - `GET /api/audit-packages/range?from=&to=` — filter by date range

---

## 4. Project Structure (Backend)

```
reporting-service/
├── ReportingServiceApplication.java     ← @SpringBootApplication, main()
│
├── controller/                          ← REST layer (3 controllers)
│   ├── ReportController.java
│   ├── KPIController.java
│   └── AuditPackageController.java
│
├── service/                             ← Business logic (5 services)
│   ├── ReportService.java               ← orchestrates report creation
│   ├── KPIService.java                  ← KPI calculations + rate limiting
│   ├── AuditPackageService.java         ← snapshot generation
│   ├── PdfGeneratorService.java         ← OpenPDF — turns data into PDF bytes
│   └── ReportContentGeneratorService.java  ← aggregates data from Feign clients
│
├── repository/                          ← Spring Data JPA (3 repos)
│   ├── ReportRepository.java
│   ├── KPIRepository.java
│   └── AuditPackageRepository.java
│
├── entity/                              ← JPA @Entity (3 entities)
│   ├── Report.java
│   ├── KPI.java
│   └── AuditPackage.java
│
├── dto/                                 ← Request + Response DTOs + Mapper
│
├── enums/
│   └── ReportScope.java                 ← OPERATIONAL / FINANCIAL / OCCUPANCY / REVENUE
│
├── client/                              ← Feign clients for peer services
│   ├── FinanceClient.java
│   ├── ReservationClient.java
│   ├── RoomServiceClient.java
│   ├── ServiceOrderClient.java
│   ├── UserServiceClient.java
│   ├── dto/                             ← peer-service DTOs (read-only)
│   └── fallback/                        ← Resilience4j fallbacks
│       └── (FinanceClientFallback.java, etc.)
│
├── security/                            ← Gateway-trusted header auth
│   ├── SecurityConfig.java              ← HeaderAuthFilter + RoleInterceptor
│   └── RoleRequired.java                ← @RoleRequired annotation
│
├── config/
│   ├── FeignJwtInterceptor.java         ← forwards X-Auth-* on outgoing Feign calls
│   ├── ReportingHealthIndicator.java
│   └── WebConfig.java
│
└── common/exception/                    ← GlobalExceptionHandler + custom exceptions
```

**Talking points the interviewer will love:**
- *"I followed a strict layered architecture — Controller → Service → Repository, with DTOs at the boundary so we never leak entities to the wire."*
- *"Feign clients live in their own package with co-located fallbacks — if Finance is down, my service still returns degraded KPIs instead of 500-ing."*

---

## 5. Backend — Key Code Concepts

### 5.1 Spring Boot + JPA basics
- `@SpringBootApplication` boots the service.
- `@RestController` + `@RequestMapping("/api/reports")` exposes HTTP endpoints.
- `@Service` + `@Transactional` wraps each business method in a DB transaction.
- `@Repository extends JpaRepository<Report, Long>` gives you `findAll`, `save`, `findById` for free.
- `@Entity` + `@Table(name = "reports")` maps a Java class to a MySQL table.

### 5.2 Inter-service communication — Feign Clients
```java
@FeignClient(name = "finance-service", fallback = FinanceClientFallback.class)
public interface FinanceClient {
    @GetMapping("/api/invoices")
    List<InvoiceDto> getAllInvoices();
}
```

**How to explain this:**
> *"I use **Spring Cloud OpenFeign** for declarative HTTP clients. Each peer service has a Feign interface — I just call `financeClient.getAllInvoices()` and Spring builds an HTTP call to `lb://FINANCE-SERVICE/api/invoices`, looks up the actual host via **Eureka**, sends the request, and deserialises the response. Way cleaner than RestTemplate."*

### 5.3 Resilience4j — Circuit Breaker + Rate Limiter
Configured in `application.yml`:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      finance-service:
        slidingWindowSize: 10
        failureRateThreshold: 50      # ← open circuit if 50% of last 10 calls failed
        waitDurationInOpenState: 10s  # ← stay open for 10s, then try again
        permittedNumberOfCallsInHalfOpenState: 3
  ratelimiter:
    instances:
      reportGeneration:
        limitForPeriod: 5             # ← max 5 calls
        limitRefreshPeriod: 10s       # ← per 10 seconds
```

**Talking points:**
- *"Reports involve calling 5 different services. If Finance is slow, I don't want to cascade-fail my service too. The **circuit breaker** detects sustained failures and short-circuits the call to the fallback, which returns an empty `List<InvoiceDto>` instead of throwing. The frontend shows '0 revenue' for that window, which is better than a 500."*
- *"Report generation is **rate-limited** to 5 per 10 seconds — PDF generation is expensive (CPU + memory), so if someone hammers the endpoint, the rate limiter sheds the load before it crashes the service."*

### 5.4 Security — Gateway-validated, header-trusted
```java
// All controllers use:
@GetMapping("/api/reports")
@RoleRequired({"MANAGER", "ADMINISTRATOR", "AUDITOR"})
public ResponseEntity<List<ReportResponseDto>> getAllReports() { ... }
```

**How to explain:**
> *"I don't validate JWTs in this service — the API Gateway does that once, then injects `X-Auth-User` and `X-Auth-Role` headers into the forwarded request. My `HeaderAuthFilter` reads those headers and populates Spring's `SecurityContext`. A `RoleInterceptor` then checks the `@RoleRequired` annotation on each controller method against the user's role and returns 403 if there's a mismatch. This avoids duplicating JWT-parsing logic in every service."*

### 5.5 PDF Generation
```java
@Service
public class PdfGeneratorService {
    public byte[] generateOccupancyReportPdf(...) {
        Document doc = new Document();
        PdfWriter.getInstance(doc, byteStream);
        doc.open();
        doc.add(new Paragraph("HospEase — Occupancy Report"));
        // ... add tables, totals
        doc.close();
        return byteStream.toByteArray();
    }
}
```

Uses **OpenPDF** (Apache 2 forked from iText) to write the bytes. The controller returns them as `application/pdf` content-type with a `Content-Disposition: attachment` header so the browser downloads it.

---

## 6. Database Schema (`reporting_db`)

3 tables, no foreign keys (cross-service IDs stored as plain `BIGINT`):

```sql
reports (
    report_id            BIGINT PK AUTO_INCREMENT,
    report_type          VARCHAR(64),
    scope                VARCHAR(32),       -- OPERATIONAL / FINANCIAL / OCCUPANCY / REVENUE
    generated_by_staff_id BIGINT,
    content_summary      TEXT,
    report_uri           VARCHAR(255),
    generated_at         DATETIME
)

kpis (
    kpi_id           BIGINT PK,
    name             VARCHAR(100),
    definition       VARCHAR(255),
    target           DECIMAL(10,2),
    current_value    DECIMAL(10,2),
    reporting_period VARCHAR(64)
)

audit_packages (
    package_id     BIGINT PK,
    period_start   DATE,
    period_end     DATE,
    contents_json  TEXT,              -- the actual snapshot
    package_uri    VARCHAR(255),
    generated_at   DATETIME
)
```

**Why no FKs?** *"This is a microservices architecture — each service owns its own DB. We can't FK to `users.user_id` in another service. Cross-service references are stored as plain longs and validated at the API boundary."*

---

## 7. Frontend — React + TypeScript + TanStack Query

### 7.1 Pages I built

| Route | File | What it shows |
|---|---|---|
| `/reporting` | `ReportingDashboard.tsx` | Overview: KPI trend chart, revenue chart, recent reports |
| `/reporting/kpis` | `KPIs.tsx` | All KPIs with progress bars, calculate buttons, edit |
| `/reporting/scheduled` | `ScheduledReports.tsx` | Manual report creation, list of generated reports, download buttons |
| `/reporting/compliance` | `ComplianceExports.tsx` | Audit Package generation + downloads |

### 7.2 Stack
- **React + TypeScript** — type-safe components
- **TanStack Query** (`@tanstack/react-query`) — server-state caching, auto-refetch on focus
- **Axios** — HTTP client, configured with a global interceptor that attaches the JWT from localStorage
- **Tailwind CSS** — utility classes for styling
- **Recharts** — for KPI trend lines and revenue bar charts
- **Zustand** — global state (auth, workflow, toast notifications)

### 7.3 Typical data-flow code

```typescript
// api/reporting.ts — declares the API surface
export const kpisApi = {
  getAll: () => apiClient.get<KPIResponseDto[]>('/kpis').then(r => r.data),
  calculateOccupancy: (id) => apiClient.post(`/kpis/${id}/calculate-occupancy`),
};

// KPIs.tsx
const { data: kpis = [] } = useQuery({
  queryKey: ['kpis'],
  queryFn: kpisApi.getAll,
});

const calcMutation = useMutation({
  mutationFn: kpisApi.calculateOccupancy,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kpis'] }),
});
```

**Talking points:**
- *"TanStack Query gives me **automatic refetching** when the window regains focus, **request deduplication** (multiple components asking for the same data → one HTTP call), and **optimistic updates** for mutations. I use it everywhere instead of vanilla useEffect + useState."*
- *"All API calls go through one `apiClient` axios instance that has a request interceptor attaching the JWT, and a response interceptor that auto-redirects to /login on 401."*

---

## 8. Critical End-to-End Flow to Memorise

> ⭐ This is THE flow to walk through if asked "show me how a feature works."

**"How does an Auditor generate a Compliance Report?"**

```
1. Auditor clicks "Generate Report" on /reporting/scheduled
              │
              ▼
2. React → POST /api/reports
   Body: { reportType: 'OCCUPANCY_MONTHLY', scope: 'OCCUPANCY', ... }
   Headers: Authorization: Bearer <JWT>
              │
              ▼
3. API Gateway:
   - validates JWT (signature + expiry)
   - extracts email + role from claims
   - injects X-Auth-User: auditor@hospease.com
            X-Auth-Role: AUDITOR
   - forwards to lb://REPORTING-SERVICE
              │
              ▼
4. Reporting-service:
   - HeaderAuthFilter populates SecurityContext from X-Auth-* headers
   - RoleInterceptor checks @RoleRequired({"MANAGER","ADMIN","AUDITOR"}) ✓
   - Resilience4j RateLimiter checks: under 5/10s? ✓
   - ReportController.createReport()
              │
              ▼
5. ReportService.createReport(dto):
   - calls reportContentGenerator.aggregate(scope)
       - calls reservationClient.getReservationsInRange()  ← Feign
       - calls roomServiceClient.getAllRooms()             ← Feign
       - calls financeClient.getInvoicesInRange()          ← Feign
       (each call is protected by a circuit breaker)
   - PdfGeneratorService.generatePdf(aggregated)
   - writes Report row + PDF blob to disk
   - returns ReportResponseDto
              │
              ▼
6. Frontend receives 201 → invalidates ['reports'] query
   → list refetches → new report appears with "Download" button
              │
              ▼
7. Auditor clicks Download → GET /api/reports/{id}/download
   - server reads PDF from disk, returns as Blob
   - browser auto-downloads
```

If you can walk through THIS clearly, you'll nail the interview.

---

## 9. Likely Interview Questions & Strong Answers

### Q1: "Why microservices? Why not a monolith?"
> *"Each module has a different team / lifecycle / scaling profile. Finance might need to scale up at month-end; reporting peaks for quarterly reports. Independent deployment, isolated failure domains, and the ability to pick the right tech per service. The trade-off is operational complexity — which we manage with Eureka for discovery, Spring Cloud Config for shared config, and Resilience4j for cross-service fault tolerance."*

### Q2: "What happens if Finance service is down when generating a report?"
> *"The Feign client is annotated with a `fallback` class. When Resilience4j detects sustained failures, it opens the circuit. New calls go to `FinanceClientFallback.getAllInvoices()` which returns an empty list. My report generates with $0 in the finance section, and the UI shows that with a warning banner. No 500s, no cascading failure. After 10 seconds, the circuit goes half-open and tries 3 test calls. If they succeed, the circuit closes."*

### Q3: "How do you handle authentication?"
> *"JWT validation is **centralised at the API Gateway**. My service receives the request with two trusted headers — `X-Auth-User` and `X-Auth-Role`. My `HeaderAuthFilter` populates `SecurityContext` from those, then a `RoleInterceptor` enforces the `@RoleRequired` annotation on each endpoint. This avoids duplicating JWT-parsing logic in every service — one validator, six trusters."*

### Q4: "How do you handle database changes?"
> *"`spring.jpa.hibernate.ddl-auto=update` lets Hibernate sync the schema on startup for adds (new columns, new tables). For changes that Hibernate can't handle automatically — like widening an existing column or relaxing a NOT NULL — I have a `schema.sql` with idempotent `ALTER TABLE` statements that run on every boot."*

### Q5: "What was the hardest bug you solved?"
> Pick one of:
> - **The lazy-loading 500:** *"Payments had a `@ManyToOne(LAZY)` to Invoice. The DTO mapper read `payment.getInvoice().getInvoiceId()` AFTER the @Transactional method returned. With `open-in-view=false`, the Hibernate session was closed → LazyInitializationException → 500 on every GET. I fixed it by adding a read-only mirror column `@Column(name='invoice_id', insertable=false, updatable=false)` so the DTO reads the FK directly without traversing the relationship."*
> - **The role-prefix mismatch:** *"My `HeaderAuthFilter` was adding a `ROLE_` prefix to the authority, but Spring's `@PreAuthorize("hasAuthority('AUDITOR')")` doesn't auto-add the prefix (only `hasRole()` does). So all my audit-log endpoints were silently 403'ing. Fixed it by using the raw role string."*

### Q6: "How do you test it?"
> *"Unit tests with JUnit + Mockito on the service layer — mock the repositories and Feign clients. Integration tests with `@SpringBootTest` + Testcontainers for MySQL. For the frontend, React Testing Library + MSW for mocking the API. Manual smoke testing via Postman collection covering all 15 endpoints. End-to-end test plan documented in `E2E_TEST_REPORT.md` covering all roles."*

### Q7: "How does the frontend get the data?"
> *"React + TypeScript with TanStack Query. Every page declares its queries — e.g., `useQuery({ queryKey: ['kpis'], queryFn: kpisApi.getAll })`. Axios is configured with a request interceptor that attaches the JWT from `localStorage`. The response interceptor handles 401s by clearing localStorage and redirecting to `/login`. Charts use Recharts, styling is Tailwind."*

### Q8: "What's the role of the API Gateway?"
> *"Single entry point for the frontend. It does three jobs: (1) **routing** based on path (`/api/reports/**` → reporting-service via Eureka discovery), (2) **JWT validation** — checks signature and expiry, (3) **header injection** — adds `X-Auth-User` and `X-Auth-Role` so downstream services don't have to re-parse the JWT. Built on **Spring Cloud Gateway** which is reactive (WebFlux)."*

### Q9: "How do you handle errors globally?"
> *"`@RestControllerAdvice` on `GlobalExceptionHandler` that converts exceptions to consistent JSON `ErrorResponse` shape — `{ timestamp, status, error, message, path }`. `ResourceNotFoundException` → 404, `BadRequestException` → 400, `DataIntegrityViolationException` → 409, anything else → 500 with the exception message logged."*

### Q10: "How would you scale this?"
> *"Three levers: **horizontal** — multiple instances behind Eureka, the gateway load-balances. **Caching** — Redis for KPI calculations (they're read-heavy, slow to compute). **Async** — push report generation to a queue (RabbitMQ/Kafka) so the request returns immediately with a job ID, and the user polls for completion. For PDFs, store them in S3 instead of local disk so multiple instances share storage."*

---

## 10. Strong Words To Use (Sound Senior)

When describing your service, sprinkle these in:

| Concept | Word to use |
|---|---|
| Service runs as a process | "Deployed independently" |
| Calls another service | "Synchronous downstream call via Feign" |
| Fallback returns empty | "Graceful degradation under circuit-open state" |
| Schema/DB | "Owned data store" (each service owns its DB) |
| API contract | "DTOs as the wire boundary — no entity leakage" |
| Auth | "Trusted-header pattern with gateway as the validator" |
| Transactions | "ACID semantics within the service, eventual consistency across services" |
| Failure handling | "Bulkhead and circuit-breaker isolation" |

---

## 11. What NOT to Say

- ❌ *"It's a service that does stuff with data."* (vague)
- ❌ *"I just copied this from a tutorial."* (kills confidence)
- ❌ *"I'm not sure how Resilience4j works under the hood."* (say "it tracks failure rate in a sliding window; once threshold is crossed it transitions to OPEN state" — even if you don't know all the internals, sound deliberate)
- ❌ *"The frontend just calls the API."* (say *"The frontend uses TanStack Query for declarative server-state management, with optimistic mutations and automatic refetch on window focus."*)

---

## 12. One-line Concept-Cheat-Sheet

| If asked about... | Say... |
|---|---|
| `@SpringBootApplication` | "Triggers component scan + auto-config" |
| `@RestController` | "HTTP-bound bean that returns JSON, not views" |
| `@Service` | "Business logic layer, transactional boundary" |
| `@Repository` | "Persistence layer; with Spring Data JPA I get free CRUD" |
| `@Transactional` | "Wraps the method in a DB transaction; commit on return, rollback on RuntimeException" |
| `@FeignClient` | "Declarative HTTP client; Spring generates the implementation at boot" |
| `@RoleRequired` | "My custom annotation enforced by a HandlerInterceptor" |
| Eureka | "Service discovery — services register themselves and look up peers by logical name" |
| Resilience4j | "Fault-tolerance library — CircuitBreaker, RateLimiter, Retry, Bulkhead" |
| TanStack Query | "Server-state management — caches, dedupes, refetches" |
| Axios interceptor | "Middleware on the HTTP client — I use one for the JWT, one for 401 handling" |

---

## 13. Final Tips

- **Have the code open in your IDE during the interview** if it's remote. Hop to a specific file when explaining a concept.
- **Draw the architecture diagram** on a whiteboard / virtual whiteboard. Interviewers love this. Memorise the 6-box diagram in §2.
- **Tell stories**: *"There was this bug where..."* — concrete examples beat abstract knowledge every time.
- **Speak in trade-offs**: *"I chose X because Y, but the downside is Z, which I mitigated by ..."*
- **Admit gaps gracefully**: *"I haven't worked with Kafka in this project, but the same pattern would apply — async event-driven communication for cross-service notifications."*

Good luck! 🚀
