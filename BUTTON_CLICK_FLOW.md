# Behind the Scenes — Full Flow When You Click a Button

> **Scenario:** Auditor opens `/reporting/kpis` and clicks **"Calculate Occupancy"** on a KPI card.
> What happens? Which files are touched? What runs where?

This document traces every single file involved, in order, from the click to the screen refresh.

---

## The 30-Second Summary

```
Browser Click  →  React Component  →  TanStack Query Mutation  →  API Client (Axios)
                                                                        │
Vite Dev Server proxies /api → port 8765                                │
                                                                        ▼
API Gateway (Spring Cloud Gateway) validates JWT  →  injects X-Auth-* headers
                                                                        │
                                              Eureka lookup → port 8088 │
                                                                        ▼
HeaderAuthFilter → RoleInterceptor → Controller → Service → Repository → MySQL
                                                                        │
                                          DTO mapping ← JSON serialisation
                                                                        ▼
Axios receives response → TanStack Query updates cache → React re-renders
```

**Total files touched:** ~20 (browser-side and server-side). I'll walk through every one.

---

## Stage 1 — The Click (Browser)

### File 1: [`pages/reporting/KPIs.tsx`](C:\MyProject\microhospease\frontend\hospease\src\pages\reporting\KPIs.tsx)

The button lives in this React component. Simplified:

```tsx
// 1. Component imports
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kpisApi } from '../../api/reporting';

export default function KPIs() {
  const queryClient = useQueryClient();

  // 2. Fetch current KPI list (auto-runs on mount)
  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis'],
    queryFn: kpisApi.getAll,
  });

  // 3. Define the mutation for the "Calculate" button
  const calcOccupancyMutation = useMutation({
    mutationFn: (id: string) => kpisApi.calculateOccupancy(id),
    onSuccess: () => {
      // 4. After success, invalidate cache so the list refetches
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    },
  });

  return (
    <div>
      {kpis.map(kpi => (
        <div key={kpi.kpiId}>
          <h3>{kpi.name}</h3>
          <p>Current: {kpi.currentValue}</p>
          {/* 5. THE BUTTON */}
          <button onClick={() => calcOccupancyMutation.mutate(kpi.kpiId)}>
            Calculate Occupancy
          </button>
        </div>
      ))}
    </div>
  );
}
```

**What happens when the user clicks:**
- React fires the `onClick` handler.
- It calls `calcOccupancyMutation.mutate(kpi.kpiId)`.
- TanStack Query takes over — runs the `mutationFn` asynchronously.

---

### File 2: [`api/reporting.ts`](C:\MyProject\microhospease\frontend\hospease\src\api\reporting.ts)

The API client layer. This defines WHAT the HTTP call looks like:

```typescript
import apiClient from './client';

export const kpisApi = {
  getAll: () =>
    apiClient.get<KPIResponseDto[]>('/kpis').then(r => r.data),

  calculateOccupancy: (id: string) =>
    apiClient.post<KPIResponseDto>(`/kpis/${id}/calculate-occupancy`).then(r => r.data),
};
```

**What this does:**
- Builds a URL: `/kpis/5/calculate-occupancy`
- Calls `apiClient.post(...)` — `apiClient` is a pre-configured Axios instance.

---

### File 3: [`api/client.ts`](C:\MyProject\microhospease\frontend\hospease\src\api\client.ts)

The axios setup with **interceptors**:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',                            // ← all calls prefixed with /api
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// REQUEST interceptor — runs BEFORE every request goes out
apiClient.interceptors.request.use((config) => {
  const token = getToken();                   // ← reads JWT from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE interceptor — runs AFTER response comes back
apiClient.interceptors.response.use(
  (res) => res,                               // pass success through
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hospease-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Helper that pulls JWT from Zustand-persisted localStorage
function getToken(): string | null {
  const raw = localStorage.getItem('hospease-auth');
  if (!raw) return null;
  return JSON.parse(raw)?.state?.token ?? null;
}
```

**What happens:**
- `apiClient.post('/kpis/5/calculate-occupancy')` becomes `POST /api/kpis/5/calculate-occupancy`.
- The request interceptor reads the JWT from localStorage (set by [`store/authStore.ts`](C:\MyProject\microhospease\frontend\hospease\src\store\authStore.ts) at login).
- Attaches `Authorization: Bearer eyJhbGc...` header.
- Sends the request.

---

### File 4: `vite.config.ts` (frontend root)

The dev-time **proxy** that redirects `/api/*` calls to the gateway:

```typescript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8765',     // ← API Gateway
        changeOrigin: true,
      },
    },
  },
});
```

**Why this matters:**
- The frontend runs on `localhost:3000`. The backend on `localhost:8765`.
- Browsers block cross-origin AJAX without CORS.
- Vite's proxy makes calls to `/api/...` look like same-origin to the browser, then forwards them server-side to port 8765.
- In production, an nginx or AWS ALB does this same job.

**So the actual HTTP request becomes:**
```
POST http://localhost:8765/api/kpis/5/calculate-occupancy
Headers:
    Authorization: Bearer eyJhbGc...
    Content-Type: application/json
```

---

## Stage 2 — The API Gateway

### File 5: [`api-gateway/src/main/resources/application.yml`](C:\MyProject\microhospease\api-gateway\src\main\resources\application.yml)

The routing rules:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: reporting-service-route
          uri: lb://REPORTING-SERVICE          # ← Eureka load-balanced lookup
          predicates:
            - Path=/api/reports/**, /api/kpis/**, /api/audit-packages/**
          filters:
            - Authentication                    # ← my custom JWT filter
```

**What happens:**
- Gateway sees `/api/kpis/5/calculate-occupancy`.
- Matches `/api/kpis/**` predicate → this route applies.
- The `Authentication` filter runs first.
- After auth, gateway looks up `REPORTING-SERVICE` in Eureka, finds `127.0.0.1:8088`, forwards the request.

---

### File 6: [`api-gateway/.../AuthenticationGatewayFilterFactory.java`](C:\MyProject\microhospease\api-gateway\src\main\java\com\hospease\filter\AuthenticationGatewayFilterFactory.java)

The custom Spring Cloud Gateway filter — validates the JWT once for the whole system:

```java
@Component
public class AuthenticationGatewayFilterFactory
        extends AbstractGatewayFilterFactory<...> {

    @Value("${app.jwt.secret}")
    private String secret;

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // 1. Pull Authorization header
            String authHeader = exchange.getRequest().getHeaders()
                                        .getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            String token = authHeader.substring(7);

            // 2. Validate signature + expiry via JJWT
            Claims claims;
            try {
                claims = Jwts.parser()
                        .verifyWith(getSigningKey())
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
            } catch (Exception e) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // 3. Extract claims and INJECT them as trusted headers
            String email  = claims.getSubject();
            String role   = claims.get("role",   String.class);
            String userId = String.valueOf(claims.get("userId"));

            return chain.filter(
                exchange.mutate()
                    .request(r -> r
                        // CRITICAL: strip any spoofed inbound headers first
                        .headers(h -> {
                            h.remove("X-Auth-User");
                            h.remove("X-Auth-Role");
                            h.remove("X-Auth-User-Id");
                        })
                        // Then inject trusted values
                        .header("X-Auth-User",    email)
                        .header("X-Auth-Role",    role)
                        .header("X-Auth-User-Id", userId))
                    .build()
            );
        };
    }
}
```

**The full forwarded request now looks like:**

```
POST http://127.0.0.1:8088/api/kpis/5/calculate-occupancy
Headers:
    Authorization:    Bearer eyJhbGc...          ← still forwarded
    X-Auth-User:      auditor@hospease.com       ← NEW (gateway-trusted)
    X-Auth-Role:      AUDITOR                    ← NEW
    X-Auth-User-Id:   42                         ← NEW
```

---

## Stage 3 — Inside the Reporting Service

### File 7: [`reporting-service/.../security/SecurityConfig.java`](C:\MyProject\microhospease\reporting-service\src\main\java\com\cognizant\hospease\security\SecurityConfig.java)

This single file contains 3 things — the security chain, the header-auth filter, and the role interceptor:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig implements WebMvcConfigurer {

    public static final String USER_HEADER = "X-Auth-User";
    public static final String ROLE_HEADER = "X-Auth-Role";

    // (a) Spring Security filter chain — wires HeaderAuthFilter in
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .addFilterBefore(headerAuthFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // (b) Register RoleInterceptor for all /api/** routes
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RoleInterceptor())
                .addPathPatterns("/api/**");
    }

    // (c) HeaderAuthFilter — reads the trusted headers
    public static class HeaderAuthFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest req,
                                        HttpServletResponse res,
                                        FilterChain chain) throws ... {
            String user = req.getHeader(USER_HEADER);
            String role = req.getHeader(ROLE_HEADER);
            if (user != null && role != null) {
                UserDetails details = User.withUsername(user)
                    .password("")
                    .authorities(role)              // ← raw role, no ROLE_ prefix
                    .build();
                var auth = new UsernamePasswordAuthenticationToken(details, null,
                                                          details.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
            chain.doFilter(req, res);
        }
    }

    // (d) RoleInterceptor — enforces @RoleRequired
    public static class RoleInterceptor implements HandlerInterceptor {
        @Override
        public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
            if (!(handler instanceof HandlerMethod hm)) return true;
            RoleRequired ann = hm.getMethodAnnotation(RoleRequired.class);
            if (ann == null) return true;            // no annotation = no check

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userRole = auth.getAuthorities().iterator().next().getAuthority();

            if (!Arrays.asList(ann.value()).contains(userRole)) {
                res.sendError(403, "Role '" + userRole + "' not authorised");
                return false;
            }
            return true;
        }
    }
}
```

**What happens:**
1. **HeaderAuthFilter** runs first (Spring Security filter chain). Reads `X-Auth-User` and `X-Auth-Role`. Builds a Spring `Authentication` object and puts it in `SecurityContextHolder` so the rest of the request has it.
2. Then **DispatcherServlet** routes to the matching controller method.
3. **Before** the controller runs, **RoleInterceptor.preHandle()** fires. It checks the `@RoleRequired` annotation on the method against the user's role from `SecurityContextHolder`. If mismatch → 403. If match → method runs.

---

### File 8: [`controller/KPIController.java`](C:\MyProject\microhospease\reporting-service\src\main\java\com\cognizant\hospease\controller\KPIController.java)

The REST endpoint that the request actually hits:

```java
@RestController
@RequestMapping("/api/kpis")
@RequiredArgsConstructor
public class KPIController {

    private final KPIService kpiService;

    @PostMapping("/{id}/calculate-occupancy")
    @RoleRequired({"AUDITOR", "MANAGER", "ADMINISTRATOR"})
    public ResponseEntity<KPIResponseDto> calculateOccupancy(@PathVariable Long id) {
        return ResponseEntity.ok(kpiService.calculateOccupancy(id));
    }
}
```

**What happens:**
- Spring matches `POST /api/kpis/5/calculate-occupancy` to this method via path pattern.
- `@PathVariable Long id` extracts `5` from the URL.
- `@RoleRequired` annotation is read by `RoleInterceptor` BEFORE this method runs (already happened in step 7).
- Calls `kpiService.calculateOccupancy(5)`.

---

### File 9: [`service/KPIService.java`](C:\MyProject\microhospease\reporting-service\src\main\java\com\cognizant\hospease\service\KPIService.java)

The business logic layer. This is where the real work happens:

```java
@Service
@RequiredArgsConstructor
@Transactional
public class KPIService {

    private final KPIRepository kpiRepository;
    private final ReservationClient reservationClient;   // ← Feign
    private final RoomServiceClient roomServiceClient;   // ← Feign

    public KPIResponseDto calculateOccupancy(Long id) {
        // 1. Load the KPI entity
        KPI kpi = kpiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KPI", "id", id));

        // 2. Call Reservation Service via Feign
        List<ReservationDto> reservations = reservationClient.getActiveReservations();

        // 3. Call Room Service via Feign
        List<RoomDto> rooms = roomServiceClient.getAllRooms();

        // 4. Calculate occupancy
        long occupiedRooms = reservations.stream()
                .filter(r -> "CHECKED_IN".equals(r.getStatus()))
                .count();
        BigDecimal occupancy = rooms.isEmpty()
            ? BigDecimal.ZERO
            : BigDecimal.valueOf(occupiedRooms * 100.0 / rooms.size());

        // 5. Update the KPI entity
        kpi.setCurrentValue(occupancy);
        KPI saved = kpiRepository.save(kpi);

        // 6. Convert to DTO and return
        return DtoMapper.toKpiResponseDto(saved);
    }
}
```

**The class-level `@Transactional`** means: this whole method runs inside a DB transaction. If anything throws, all changes roll back. The transaction is **committed when the method returns**.

---

### File 10 & 11: Feign Clients — `client/ReservationClient.java` and `client/RoomServiceClient.java`

```java
@FeignClient(
    name = "guest-reservation-service",                      // ← Eureka name
    fallback = ReservationClientFallback.class                // ← Resilience4j fallback
)
public interface ReservationClient {

    @GetMapping("/api/v1/reservations")
    List<ReservationDto> getActiveReservations();
}
```

**What happens at runtime:**
- Spring Cloud OpenFeign **generates an implementation** of this interface at boot time.
- When `reservationClient.getActiveReservations()` is called:
  1. Looks up `guest-reservation-service` in Eureka → returns `127.0.0.1:8083`
  2. Issues `GET http://127.0.0.1:8083/api/v1/reservations`
  3. Deserialises the JSON response into `List<ReservationDto>`
- **Resilience4j circuit breaker** wraps the call. If 50% of calls in a 10-call sliding window fail, the circuit opens and subsequent calls return the fallback's response.

---

### File 12: [`config/FeignJwtInterceptor.java`](C:\MyProject\microhospease\reporting-service\src\main\java\com\cognizant\hospease\config\FeignJwtInterceptor.java)

Adds auth headers to **every outgoing Feign call** so downstream services trust them:

```java
@Component
public class FeignJwtInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attrs = (ServletRequestAttributes)
                RequestContextHolder.getRequestAttributes();
        if (attrs == null) return;

        HttpServletRequest request = attrs.getRequest();

        // Forward the trusted gateway-injected headers so downstream service
        // sees them and can populate its own SecurityContext
        forward(template, request, "X-Auth-User");
        forward(template, request, "X-Auth-Role");
        forward(template, request, "X-Auth-User-Id");

        // Also forward Authorization for back-compat
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            template.header("Authorization", auth);
        }
    }
}
```

**Why this is needed:**
- When reporting-service calls reservation-service, that service ALSO has `HeaderAuthFilter` expecting `X-Auth-User` / `X-Auth-Role`.
- Without this interceptor, the Feign call would be unauthenticated and rejected.

---

### File 13: [`repository/KPIRepository.java`](C:\MyProject\microhospease\reporting-service\src\main\java\com\cognizant\hospease\repository\KPIRepository.java)

```java
@Repository
public interface KPIRepository extends JpaRepository<KPI, Long> {
    List<KPI> findByReportingPeriod(String period);
}
```

**What happens:**
- `JpaRepository<KPI, Long>` gives free CRUD: `findAll`, `save`, `findById`, `deleteById`.
- `kpiRepository.findById(5)` → Hibernate emits `SELECT * FROM kpis WHERE kpi_id = 5`.
- `kpiRepository.save(kpi)` → Hibernate emits `UPDATE kpis SET current_value=? WHERE kpi_id=5` (because the entity already has an ID, Hibernate treats it as UPDATE).

---

### File 14: [`entity/KPI.java`](C:\MyProject\microhospease\reporting-service\src\main\java\com\cognizant\hospease\entity\KPI.java)

```java
@Entity
@Table(name = "kpis")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KPI {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long kpiId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 255)
    private String definition;

    @Column(precision = 10, scale = 2)
    private BigDecimal target;

    @Column(name = "current_value", precision = 10, scale = 2)
    private BigDecimal currentValue;

    private String reportingPeriod;
}
```

**Maps directly to the `kpis` table** in MySQL `reporting_db`.

---

### File 15: MySQL Database — `reporting_db.kpis` table

Hibernate generates and executes:

```sql
-- For findById(5)
SELECT kpi_id, name, definition, target, current_value, reporting_period
FROM kpis
WHERE kpi_id = 5;

-- For save(kpi) (after we set currentValue = 87.5)
UPDATE kpis
SET name = ?, definition = ?, target = ?, current_value = ?, reporting_period = ?
WHERE kpi_id = 5;
```

Result: one row updated. Transaction commits when `calculateOccupancy()` returns.

---

### File 16: [`dto/DtoMapper.java`](C:\MyProject\microhospease\reporting-service\src\main\java\com\cognizant\hospease\dto\DtoMapper.java)

Converts the entity to a DTO before sending it back:

```java
public static KPIResponseDto toKpiResponseDto(KPI kpi) {
    return KPIResponseDto.builder()
        .kpiId(kpi.getKpiId())
        .name(kpi.getName())
        .definition(kpi.getDefinition())
        .target(kpi.getTarget())
        .currentValue(kpi.getCurrentValue())
        .reportingPeriod(kpi.getReportingPeriod())
        .build();
}
```

**Why a DTO and not the entity?**
- DTOs are the **wire boundary**. We never expose JPA entities to JSON serialisation because:
  - Lazy-loaded fields would trigger queries during serialisation
  - Internal fields (like `createdAt`, audit columns) leak to API consumers
  - DTOs can be evolved independently of the DB schema

---

### Files 17 & 18: Response Serialisation (Spring + Jackson)

The controller returns `ResponseEntity.ok(dto)`. Spring's `RequestMappingHandlerAdapter` then:
1. Calls **Jackson** (`MappingJackson2HttpMessageConverter`) to serialise `KPIResponseDto` → JSON bytes
2. Writes those bytes to the HTTP response body
3. Sets `Content-Type: application/json`

The HTTP response (going back through the gateway to the browser):

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "kpiId": 5,
  "name": "Occupancy Rate",
  "definition": "Percentage of rooms occupied",
  "target": 80.00,
  "currentValue": 87.50,
  "reportingPeriod": "MONTHLY"
}
```

---

## Stage 4 — Back to the Browser

### File 19: [`api/client.ts`](C:\MyProject\microhospease\frontend\hospease\src\api\client.ts) — Response Interceptor

The same `apiClient` instance handles the response:

```typescript
apiClient.interceptors.response.use(
  (res) => res,    // ← 200 OK, just pass through
  (err) => {
    if (err.response?.status === 401) {
      // would happen if JWT expired — but we got 200, so this doesn't fire
    }
    return Promise.reject(err);
  }
);
```

For our success case, the response just flows through.

---

### File 20: TanStack Query — Cache Update

Back in `KPIs.tsx`:

```typescript
const calcOccupancyMutation = useMutation({
  mutationFn: (id: string) => kpisApi.calculateOccupancy(id),
  onSuccess: () => {
    // ← This runs when the API returns 200
    queryClient.invalidateQueries({ queryKey: ['kpis'] });
  },
});
```

**What happens:**
1. `onSuccess` callback fires.
2. `queryClient.invalidateQueries({ queryKey: ['kpis'] })` marks the `['kpis']` query as **stale**.
3. TanStack Query auto-refetches the stale query: triggers `kpisApi.getAll()` again (= `GET /api/kpis`).
4. That call goes through the entire gateway → service → DB pipeline again.
5. The fresh `kpis` array comes back with the updated `currentValue: 87.5` for KPI 5.

---

### React Re-renders

```tsx
const { data: kpis = [] } = useQuery({ queryKey: ['kpis'], queryFn: kpisApi.getAll });
```

Because `data` is reactive (it's a React state under the hood), the new array triggers a re-render. The user sees the updated value `87.5%` in the KPI card.

---

## The 20-File Cast (Complete List)

| # | Stage | File | Role |
|---|---|---|---|
| 1 | Frontend | `pages/reporting/KPIs.tsx` | The button, onClick handler |
| 2 | Frontend | `api/reporting.ts` | Declares the HTTP call |
| 3 | Frontend | `api/client.ts` | Axios instance + interceptors |
| 4 | Frontend | `vite.config.ts` | Dev proxy /api → 8765 |
| 5 | Gateway | `application.yml` | Route definitions |
| 6 | Gateway | `AuthenticationGatewayFilterFactory.java` | JWT validation + header injection |
| 7 | Service | `security/SecurityConfig.java` | HeaderAuthFilter + RoleInterceptor |
| 8 | Service | `controller/KPIController.java` | The endpoint method |
| 9 | Service | `service/KPIService.java` | Business logic |
| 10 | Service | `client/ReservationClient.java` | Feign interface |
| 11 | Service | `client/RoomServiceClient.java` | Feign interface |
| 12 | Service | `config/FeignJwtInterceptor.java` | Forwards X-Auth-* on outgoing calls |
| 13 | Service | `repository/KPIRepository.java` | Spring Data JPA |
| 14 | Service | `entity/KPI.java` | JPA entity |
| 15 | DB | `reporting_db.kpis` | MySQL table |
| 16 | Service | `dto/DtoMapper.java` | Entity → DTO conversion |
| 17 | Spring | `RequestMappingHandlerAdapter` (Spring) | Returns the response |
| 18 | Spring | `MappingJackson2HttpMessageConverter` | JSON serialisation |
| 19 | Frontend | `api/client.ts` | Response interceptor |
| 20 | Frontend | `KPIs.tsx` + TanStack Query | Cache invalidation, re-render |

---

## Mental Model Summary

```
React           Axios          Vite Proxy       API Gateway          Reporting Service       MySQL
─────           ─────          ──────────       ───────────          ─────────────────       ─────
button          POST            /api/* → 8765    JWT valid?            HeaderAuthFilter        SELECT
onClick   ───►  /api/kpis  ──►  forward      ──► Yes → inject X-Auth ──► RoleInterceptor ────► INSERT/UPDATE
                /5/calc-occ                       headers, forward         Controller        ◄────
                                                  to Reporting             Service
                                                  (lb://REPORTING)         Feign → other svcs
                                                                           DTO mapping
                                                  ◄─── JSON response   ◄── ResponseEntity
   ◄─── update ◄─── Promise resolves
   KPI value
   on screen
```

---

## How to Use This in the Interview

If asked: **"Walk me through what happens when a user clicks a button in your app"**:

1. **Don't list 20 files at once.** Pick the 5-6 critical ones.
2. **Tell it as a story** — "the user clicks, React fires the handler, that calls a mutation in TanStack Query, which makes an HTTP request via Axios, the request goes through Vite's dev proxy to the API Gateway on port 8765..."
3. **Pause for emphasis at the architectural moments**:
   - "**Here's the security trick** — the gateway validates the JWT and injects `X-Auth-User` and `X-Auth-Role` headers, so the downstream service trusts those instead of re-parsing the JWT."
   - "**Notice the data flow** — Controller → Service → Repository, with DTOs at the boundary so we never expose JPA entities to the wire."
4. **Mention resilience**: "If the Reservation service is down, Resilience4j's circuit breaker triggers a fallback so my report still generates with degraded data instead of 500-ing."
5. **Close with the cache pattern**: "On success, TanStack Query invalidates the cache, which auto-refetches the KPI list, and React re-renders the new value."

The pacing of explanation matters more than naming every file. Aim for 90 seconds end-to-end if walking the interviewer through it.

---

## Bonus: The Three Most Impressive Sentences You Can Say

1. *"My service doesn't validate JWTs — that's the gateway's job. It just trusts the X-Auth-User and X-Auth-Role headers the gateway injects, which means we have **one place to maintain auth logic** instead of six."*

2. *"Feign clients are wrapped in Resilience4j circuit breakers, so a downstream outage produces **degraded data, not cascading 500s**."*

3. *"DTOs are the **wire boundary** — entities never leak out. This decouples the API contract from the database schema, so I can refactor either side without breaking the other."*

Memorise those three and drop them in when the interviewer asks "what makes your architecture good?".

Good luck! 🚀
