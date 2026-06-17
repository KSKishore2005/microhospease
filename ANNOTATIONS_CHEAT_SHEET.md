# Annotations Used in HospEase — Interview Cheat Sheet

This is **every annotation actually used in the project** (grepped from the source), grouped by purpose, with one-line explanations you can repeat in the interview.

> **Total annotations in use:** 76+ across 7 backend services. Don't try to memorise them all — focus on the **bold** ones (the ones the interviewer is most likely to ask about).

---

## 1. Spring Boot — Core (the foundation)

| Annotation | What it does | Where in my project |
|---|---|---|
| **`@SpringBootApplication`** | Marks the main class. Combines `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`. Tells Spring to boot, auto-configure beans based on classpath, and scan the package for components. | `ReportingServiceApplication.java`, all 7 service mains |
| **`@Configuration`** | Marks a class as a Spring config file — like XML, but Java. Methods inside annotated with `@Bean` are registered as Spring beans. | `SecurityConfig.java`, `WebConfig.java`, etc. |
| **`@Bean`** | Declares a method that returns a Spring-managed bean. Spring calls the method, takes the returned object, and registers it in the container. | `securityFilterChain()`, `passwordEncoder()`, etc. |
| **`@Component`** | Generic marker for a Spring-managed bean. Anywhere I want Spring to instantiate and manage a class. | `HeaderAuthFilter`, `FeignJwtInterceptor`, etc. |
| **`@Service`** | Specialisation of `@Component` for **business logic / service layer**. Same behaviour, but semantically meaningful. | `ReportService`, `KPIService`, `PaymentService`, etc. |
| **`@Repository`** | Specialisation of `@Component` for **data access**. Also enables automatic SQL exception translation (raw JDBC exceptions → Spring's `DataAccessException`). | `KPIRepository`, `ReportRepository`, etc. |
| **`@RestController`** | Specialisation of `@Controller` for REST APIs. Adds `@ResponseBody` to every method — return value is serialised to JSON, not rendered as a view. | All controllers |
| **`@RequiredArgsConstructor`** | (Lombok) Generates a constructor with all `final` fields as parameters. Used everywhere instead of `@Autowired` field injection. | Every Spring-managed class |

**Sentence for the interview:**
> *"`@SpringBootApplication` boots my service, scans the package, and auto-configures based on what's on the classpath. My layered architecture is marked with the specialised stereotype annotations: `@RestController` → `@Service` → `@Repository`."*

---

## 2. Spring Web (REST endpoints)

| Annotation | What it does |
|---|---|
| **`@RequestMapping`** | Class-level base path (e.g. `@RequestMapping("/api/kpis")`) or method-level with method param. |
| **`@GetMapping`** | Shortcut for `@RequestMapping(method = GET)`. Used for read endpoints. |
| **`@PostMapping`** | Shortcut for POST. Used for create endpoints. |
| **`@PutMapping`** | Shortcut for PUT. Full-resource update. |
| **`@PatchMapping`** | Shortcut for PATCH. Partial update (e.g. status change). |
| **`@DeleteMapping`** | Shortcut for DELETE. |
| **`@PathVariable`** | Binds a URL path segment to a method parameter, e.g. `/{id}` → `Long id`. |
| **`@RequestParam`** | Binds a query-string parameter, e.g. `?userId=23` → `Long userId`. |
| **`@RequestBody`** | Binds the request body (JSON) to a method parameter, Jackson does the deserialisation. |
| **`@RequestHeader`** | Binds an HTTP header to a parameter — e.g. `@RequestHeader("Authorization") String token`. |
| **`@ResponseStatus`** | Sets the HTTP status code on response/exception. |

**Sentence:**
> *"I use `@RestController` with method-level `@GetMapping`/`@PostMapping`/etc. annotations. URL segments map via `@PathVariable`, query strings via `@RequestParam`, request body via `@RequestBody`. The combination gives me a clean declarative HTTP API."*

---

## 3. JPA / Hibernate (database layer)

| Annotation | What it does | Example in my project |
|---|---|---|
| **`@Entity`** | Marks a class as a JPA entity — maps to a DB table. | `KPI`, `Report`, `Payment`, `Invoice` |
| **`@Table`** | Specifies the table name + indexes. | `@Table(name="payments", indexes={...})` |
| **`@Id`** | Marks the primary key field. | `private Long kpiId;` |
| **`@GeneratedValue`** | Tells JPA to auto-generate the ID. `strategy = IDENTITY` → AUTO_INCREMENT. | `@GeneratedValue(strategy = IDENTITY)` |
| **`@Column`** | Configures a column — name, nullable, length, precision/scale. | `@Column(nullable=false, length=100)` |
| **`@Enumerated`** | Stores an enum field. `EnumType.STRING` stores the name as VARCHAR (recommended). | `@Enumerated(EnumType.STRING)` |
| **`@ManyToOne`** | Many-to-one relationship. e.g. many `Payment`s belong to one `Invoice`. | `private Invoice invoice;` |
| **`@OneToMany`** | Inverse side of `@ManyToOne`. e.g. one `Guest` has many `Reservation`s. | `private List<Reservation> reservations;` |
| **`@JoinColumn`** | Specifies the foreign-key column name. | `@JoinColumn(name="invoice_id")` |
| **`@Index`** | Creates a DB index. Used for query performance. | `@Index(name="idx_payments_invoice", columnList="invoice_id")` |
| **`@PrePersist`** | Callback method that runs **before** the entity is inserted. Used for setting `createdAt`. | `protected void onCreate() {...}` |
| **`@PreUpdate`** | Callback method that runs **before** an UPDATE. Used for `updatedAt`. | |
| **`@CreationTimestamp`** | (Hibernate) Automatically sets the field to now on insert. | `private LocalDateTime paidAt;` |
| **`@UpdateTimestamp`** | (Hibernate) Automatically updates the field on every UPDATE. | |
| **`@Lock`** | Pessimistic / optimistic locking strategy. Prevents lost-update on concurrent payments. | `@Lock(LockModeType.PESSIMISTIC_WRITE)` |
| **`@Version`** | Optimistic locking — Hibernate auto-increments and adds `WHERE version=?` to UPDATEs. | |
| **`@Query`** | Custom JPQL/native SQL query on a repository method. | `@Query("SELECT SUM(p.amount) FROM Payment p...")` |
| **`@Param`** | Names a `@Query` parameter so it matches `:name`. | `@Param("invoiceId") Long invoiceId` |

**Sentence:**
> *"My entities are mapped with JPA — `@Entity` + `@Table` define the table, `@Id` + `@GeneratedValue(IDENTITY)` give me auto-increment PKs. Relationships are `@ManyToOne` with explicit `@JoinColumn`, enums are stored with `@Enumerated(EnumType.STRING)` so they're readable in the DB. Audit timestamps use `@CreationTimestamp` and `@UpdateTimestamp`."*

---

## 4. Transactions

| Annotation | What it does |
|---|---|
| **`@Transactional`** | Wraps a method (or all methods in a class) in a DB transaction. Commits on return, **rolls back on RuntimeException**. Class-level applies to every method. |
| `@Transactional(readOnly = true)` | Hint to Hibernate that no writes happen — can skip dirty-checking, sometimes faster. |
| `@Transactional(propagation = REQUIRES_NEW)` | Always starts a new transaction, suspending the caller's. |
| `@Transactional(propagation = NOT_SUPPORTED)` | Suspends any current transaction. I used this in `GuestService.upsertByEmail` to isolate failed inserts. |

**Sentence:**
> *"Every service method runs inside `@Transactional` — single ACID unit. For reads I use `readOnly=true` as a Hibernate hint. For special cases like idempotent upserts where a constraint violation shouldn't poison the outer session, I use `NOT_SUPPORTED` propagation."*

---

## 5. Spring Security

| Annotation | What it does |
|---|---|
| **`@EnableWebSecurity`** | Turns on Spring Security and exposes the `SecurityFilterChain` bean for me to configure. |
| **`@EnableWebFluxSecurity`** | Reactive equivalent — used in the API Gateway (which is built on WebFlux). |
| **`@EnableMethodSecurity`** | Turns on annotation-based method-level security. Required for `@PreAuthorize`. |
| **`@PreAuthorize`** | Runs an expression check BEFORE the method is invoked. e.g. `@PreAuthorize("hasAuthority('ADMINISTRATOR')")`. |
| **`@RoleRequired`** | **My custom annotation.** Annotated controller methods with `@RoleRequired({"MANAGER","ADMIN"})`. Enforced by my `RoleInterceptor`. Cleaner than `@PreAuthorize` because the role list is a real String array, not an expression string. |

**Sentence:**
> *"I have my own `@RoleRequired` annotation — a clean alternative to `@PreAuthorize` that takes a `String[]` of role names. A `HandlerInterceptor` reads it before the controller method runs and checks against the user's role in `SecurityContextHolder` (populated by my `HeaderAuthFilter`)."*

---

## 6. Spring Cloud (microservices glue)

| Annotation | What it does |
|---|---|
| **`@EnableDiscoveryClient`** | Tells the service to register with the discovery server (Eureka) on startup. |
| **`@EnableFeignClients`** | Triggers a scan for `@FeignClient` interfaces and creates implementations for them at boot. |
| **`@FeignClient`** | Marks an interface as a declarative HTTP client. Spring generates the implementation. Includes service name + fallback class for circuit-breaking. |

**Example:**
```java
@FeignClient(
    name = "guest-reservation-service",
    fallback = ReservationClientFallback.class
)
public interface ReservationClient {
    @GetMapping("/api/v1/reservations")
    List<ReservationDto> getActiveReservations();
}
```

**Sentence:**
> *"`@EnableFeignClients` + `@FeignClient` give me declarative HTTP — I write an interface, Spring builds the implementation at boot. The `name` is the Eureka service name, looked up dynamically. The `fallback` is invoked by Resilience4j when the circuit breaker opens."*

---

## 7. Resilience4j (fault tolerance)

| Annotation | What it does |
|---|---|
| **`@CircuitBreaker(name = "...", fallbackMethod = "...")`** | Wraps the method in a circuit breaker. If failure rate crosses the threshold, the circuit opens and subsequent calls invoke the fallback. |
| **`@RateLimiter(name = "...")`** | Wraps the method in a rate limiter. If call rate exceeds the configured threshold, calls are rejected. I use this on `POST /api/reports` and KPI calculation endpoints. |
| `@Retry(name = "...")` | (Available but not heavily used) — retries failed calls with backoff. |
| `@Bulkhead(name = "...")` | (Available) — limits concurrent calls to isolate resource exhaustion. |

**Sentence:**
> *"Resilience4j gives me declarative fault tolerance. `@RateLimiter` on the report-generation endpoint caps it at 5 calls per 10 seconds — PDF generation is expensive. Feign calls implicitly use circuit breakers from the YAML config."*

---

## 8. Validation (Bean Validation / Jakarta Validation)

These run on DTOs annotated with `@Valid` in the controller method signature:

| Annotation | What it checks |
|---|---|
| **`@NotNull`** | Field must not be null. |
| **`@NotBlank`** | String must not be null AND not empty/whitespace. |
| **`@NotEmpty`** | Collection/string must not be empty (null OK if nullable). |
| **`@Size(min = .., max = ..)`** | Length / collection size constraints. |
| **`@Pattern(regexp = "...")`** | Regex match. |
| **`@Email`** | Valid email format. |
| **`@Positive`** | Number > 0. |
| **`@PastOrPresent`** | Date must not be in the future (e.g. `dob`). |
| **`@Future`** / **`@FutureOrPresent`** | Date must be future / future-or-now (e.g. `dueDate`). |
| **`@DecimalMin("0.01")`** | Decimal minimum value (e.g. payment amounts). |
| **`@Digits(integer = 10, fraction = 2)`** | Numeric precision (BigDecimal). |
| **`@Valid`** | Triggers cascade validation on a nested object or a request body. Goes on the parameter or field. |
| **`@Validated`** | Method-level validation marker on a controller (for parameter validation like `@Positive`). |

**Example:**
```java
@Data
public class PaymentRequestDto {
    @NotNull @Positive @Digits(integer=10, fraction=2)
    private BigDecimal amount;

    @NotBlank
    private String method;
}

// In controller:
public ResponseEntity<...> createPayment(
    @Valid @RequestBody PaymentRequestDto dto,
    @RequestParam @Positive Long invoiceId) { ... }
```

**Sentence:**
> *"DTOs carry the validation rules — `@NotBlank` + `@Size` for strings, `@Positive` + `@DecimalMin` for amounts, `@Email` for addresses. The controller annotates the parameter with `@Valid` to trigger Jakarta Validation. Invalid input gives a clean 400 with field-level error messages."*

---

## 9. Lombok (boilerplate killers)

Lombok generates getters/setters/constructors/etc. at compile time. No runtime cost.

| Annotation | What it generates |
|---|---|
| **`@Data`** | `@Getter` + `@Setter` + `@ToString` + `@EqualsAndHashCode` + `@RequiredArgsConstructor`. The "everything" annotation for DTOs/entities. |
| **`@Builder`** | Generates a builder pattern: `Foo.builder().a("x").b(2).build()`. |
| **`@Builder.Default`** | Tells Lombok to use the field's initialiser as the builder default. |
| **`@NoArgsConstructor`** | Generates `public Foo() {}` — required by JPA. |
| **`@AllArgsConstructor`** | Generates a constructor with every field as parameter. |
| **`@RequiredArgsConstructor`** | Constructor with only `final` fields. **Primary tool for dependency injection** — Spring auto-wires through it. |
| **`@Slf4j`** | Adds `private static final Logger log = LoggerFactory.getLogger(...)` to the class. |
| **`@NonNull`** | (Lombok's) Null-check at runtime — throws NPE with a clear message. |
| **`@UtilityClass`** | Makes the class final, adds a private constructor, makes all methods static. Used for `DtoMapper`. |

**Sentence:**
> *"I use Lombok heavily — `@Data` on DTOs, `@Builder` for fluent construction, `@RequiredArgsConstructor` for constructor injection (no `@Autowired`), and `@Slf4j` for logging. It cuts boilerplate by 60%."*

---

## 10. Jackson (JSON ↔ Java)

| Annotation | What it does |
|---|---|
| **`@JsonProperty("snake_case")`** | Renames a field in the JSON output. I use this on `AuthResponse.userId` → `"user_id"`. |
| **`@JsonIgnoreProperties(ignoreUnknown = true)`** | Tells Jackson to ignore fields in the incoming JSON that don't exist on the target class. Used heavily on Feign DTOs — lets the response evolve without breaking my deserialiser. |

**Sentence:**
> *"I use `@JsonProperty` for snake_case ↔ camelCase mapping, and `@JsonIgnoreProperties(ignoreUnknown=true)` on Feign DTOs so my service tolerates extra fields from upstream changes."*

---

## 11. Exception Handling

| Annotation | What it does |
|---|---|
| **`@RestControllerAdvice`** | Marks a class as a global exception handler. Methods inside annotated with `@ExceptionHandler(SomeException.class)` catch that exception across ALL controllers. |
| **`@ControllerAdvice`** | Same as above but for `@Controller` (returns views, not JSON). |
| **`@ExceptionHandler(X.class)`** | Method that handles exception type X. Returns a `ResponseEntity` shaped how I want. |
| **`@ResponseStatus(HttpStatus.X)`** | On a custom exception class, sets the HTTP status when the exception escapes a controller without being caught. |

**Example:**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> notFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(new ErrorResponse(ex.getMessage()));
    }
}
```

**Sentence:**
> *"`@RestControllerAdvice` is my global exception handler. Each `@ExceptionHandler` maps an exception type to a consistent `ErrorResponse` JSON shape with timestamp, status, message, path. The frontend always sees the same error envelope."*

---

## 12. Custom Annotations (my own)

| Annotation | What it does |
|---|---|
| **`@RoleRequired({"MANAGER","ADMIN"})`** | My custom annotation. Tells the `RoleInterceptor` which roles are allowed to call this controller method. |

**The annotation itself:**
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RoleRequired {
    String[] value();
}
```

The two meta-annotations are critical:
- **`@Target(ElementType.METHOD)`** — restricts where this annotation can be placed (method-level only)
- **`@Retention(RetentionPolicy.RUNTIME)`** — keeps the annotation available at runtime so the interceptor can read it via reflection

**Sentence:**
> *"I built my own `@RoleRequired` annotation as a cleaner alternative to `@PreAuthorize`. `@Target(METHOD)` confines it to controller methods; `@Retention(RUNTIME)` keeps it readable by my `HandlerInterceptor` at request time."*

---

## 13. Testing

| Annotation | What it does |
|---|---|
| **`@SpringBootTest`** | Boots the full Spring context for integration tests. |
| **`@Test`** | (JUnit 5) Marks a test method. |

(Tests aren't the focus of the interview — but mention you have them.)

---

## 14. Java Built-ins You'll Also See

| Annotation | What it does |
|---|---|
| **`@Override`** | Compiler check — confirms the method actually overrides a parent / interface method. |
| **`@SuppressWarnings("...")`** | Mutes a specific compiler warning. |
| **`@DateTimeFormat`** | (Spring) Tells Spring how to parse a date in a `@RequestParam` or path variable. |
| **`@Value("${app.jwt.secret}")`** | Injects a property from `application.yml` / env var into a field. |

---

## The 20 You MUST Know for the Interview

If you only have 30 minutes to prep, memorise these 20 with their one-line meanings:

1. **`@SpringBootApplication`** — main class, auto-config
2. **`@RestController`** — JSON REST controller
3. **`@Service`** — business logic layer
4. **`@Repository`** — data access layer
5. **`@Configuration`** + **`@Bean`** — Java-based bean definitions
6. **`@Component`** — generic Spring bean
7. **`@RequiredArgsConstructor`** — Lombok constructor injection
8. **`@GetMapping`/`@PostMapping`/`@PutMapping`/`@PatchMapping`/`@DeleteMapping`** — HTTP verb endpoints
9. **`@PathVariable`** + **`@RequestParam`** + **`@RequestBody`** — bind request data to method params
10. **`@Entity`** + **`@Table`** + **`@Id`** + **`@GeneratedValue`** + **`@Column`** — JPA mapping
11. **`@ManyToOne`** + **`@OneToMany`** + **`@JoinColumn`** — relationships
12. **`@Enumerated(EnumType.STRING)`** — enum storage
13. **`@Transactional`** — DB transaction wrapper
14. **`@FeignClient`** — declarative HTTP client
15. **`@EnableFeignClients`** + **`@EnableDiscoveryClient`** — turn on Cloud features
16. **`@EnableWebSecurity`** — turn on Spring Security
17. **`@Valid`** + **`@NotBlank`** + **`@Size`** — Bean Validation
18. **`@Data`** + **`@Builder`** + **`@Slf4j`** — Lombok
19. **`@JsonProperty`** — JSON field name override
20. **`@RestControllerAdvice`** + **`@ExceptionHandler`** — global error handling
21. **`@RateLimiter`** — Resilience4j fault tolerance
22. **`@RoleRequired`** — your custom auth annotation

---

## Interview Trick — When They Ask About Annotations

**They'll probably ask:** *"Tell me about some annotations you used."*

**Don't dump a list.** Instead, **tell a story** by category. Like this:

> *"I used a layered architecture, so the annotations group naturally by layer.
>
> **At the entry layer** — `@RestController` with `@GetMapping`/`@PostMapping` for the HTTP API. `@PathVariable` and `@RequestBody` bind request data, `@Valid` triggers DTO validation.
>
> **At the service layer** — `@Service` for the business beans, `@Transactional` for DB transactions, `@RequiredArgsConstructor` for constructor injection.
>
> **At the data layer** — `@Repository` with Spring Data JPA. Entities use `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column`, `@ManyToOne` with `@JoinColumn`.
>
> **For cross-service calls** — `@FeignClient` with a `fallback` for circuit-breaking.
>
> **For security** — `@EnableWebSecurity` to turn it on, and a custom `@RoleRequired` annotation for declarative role checks.
>
> **For boilerplate** — Lombok's `@Data`, `@Builder`, `@Slf4j`, `@RequiredArgsConstructor`.
>
> **For error handling** — `@RestControllerAdvice` + `@ExceptionHandler` give me a global error shape."*

That answer takes ~90 seconds and covers everything an interviewer would ask. It shows you understand **why** each annotation exists, not just that it exists.

---

## Quick "Why?" answers (the follow-ups)

If they drill into a specific annotation:

| Q | A |
|---|---|
| *"Why `@RestController` over `@Controller`?"* | `@RestController` = `@Controller` + `@ResponseBody`. Methods return objects, Jackson serialises them to JSON automatically. `@Controller` is for view-based MVC. |
| *"Why `@Transactional` at the class vs method level?"* | Class-level applies to all public methods. I use it on services so every method is transactional by default. For special cases (read-only, REQUIRES_NEW), I override at the method level. |
| *"What's the difference between `@Component`, `@Service`, `@Repository`?"* | All three register the class as a Spring bean. `@Service` and `@Repository` are semantic specialisations — same behaviour, clearer intent. `@Repository` adds one extra: it auto-translates persistence exceptions to Spring's `DataAccessException`. |
| *"Why `EnumType.STRING`?"* | The default `EnumType.ORDINAL` stores the enum index (0, 1, 2...) which breaks if you reorder values. STRING stores the name as VARCHAR — readable, refactor-safe. |
| *"What does `@Builder` actually do?"* | Generates a static inner class that provides a fluent API: `Payment.builder().amount(100).method("CASH").build()`. Cleaner than a 6-argument constructor. |
| *"How does `@Transactional` work under the hood?"* | Spring creates a proxy around the bean. When you call a `@Transactional` method, the proxy intercepts, opens a transaction, calls the real method, commits on success or rolls back on RuntimeException. Note: `@Transactional` only works on **calls coming from outside** the bean — self-invocations bypass the proxy. |

---

Good luck — you know more than you think you do! 🚀
