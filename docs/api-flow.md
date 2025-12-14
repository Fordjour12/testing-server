That's a logical progression\! Defining the endpoints (API structure) based on the Drizzle schema is essential for connecting the front-end application to the PostgreSQL database and the AI planning engine.

Here is the pseudocode draft for the major API endpoints, organized by the tables they primarily interact with, using a RESTful pattern.

-----

## 💻 API Endpoints Pseudocode

### 1\. User & Authentication Endpoints (Interacting with `users` and `generationQuota`)

| Endpoint | Method | Role | Pseudocode/Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Creates a new user account. | `async function registerUser(req: Request) {`<br>`// 1. Validate input (email, password)`<br>`// 2. Hash password`<br>`// 3. Insert into 'users' table`<br>`// 4. Initialize 'generationQuota' for the current month`<br>`// 5. Return success token}` |
| `/api/auth/login` | `POST` | Authenticates a user. | `async function loginUser(req: Request) {`<br>`// 1. Validate credentials against 'users' table`<br>`// 2. Generate JWT (or session token)`<br>`// 3. Return token}` |
| `/api/user/quota` | `GET` | Retrieves the user's monthly generation quota. | `async function getQuota(req: Request) {`<br>`// 1. Get userId from token`<br>`// 2. Query 'generationQuota' for current month`<br>`// 3. Return { totalAllowed, generationsUsed }}` |

### 2\. Planning Input Endpoints (Interacting with `userGoalsAndPreferences`)

| Endpoint | Method | Role | Pseudocode/Description |
| :--- | :--- | :--- | :--- |
| `/api/plan/inputs` | `POST` | Saves a new set of goals and preferences. **Triggers planning.** | `async function createPlanInputs(req: Request) {`<br>`// 1. Validate inputs (goals, fixed commitments, etc.)`<br>`// 2. Insert into 'userGoalsAndPreferences' table`<br>`// 3. **Trigger AI Plan Generation (see Section 4)**`<br>`// 4. Return new preference ID}` |
| `/api/plan/inputs/latest` | `GET` | Retrieves the user's most recent planning inputs for display/editing. | `async function getLatestInputs(req: Request) {`<br>`// 1. Query 'userGoalsAndPreferences' ordered by date DESC`<br>`// 2. Return latest preferences object}` |

### 3\. Plan Retrieval Endpoints (Interacting with `monthlyPlans` and `planTasks`)

| Endpoint | Method | Role | Pseudocode/Description |
| :--- | :--- | :--- | :--- |
| `/api/plan/current` | `GET` | Retrieves the entire active monthly plan. | `async function getActivePlan(req: Request) {`<br>`// 1. Query 'monthlyPlans' for the current month's plan ID`<br>`// 2. Query 'planTasks' where planId matches`<br>`// 3. Combine tasks into a weekly/daily structure (JSON) for the frontend`<br>`// 4. Return combined plan object}` |
| `/api/plan/tasks/:taskId` | `PATCH` | Updates the status of a specific task. | `async function updateTask(req: Request) {`<br>`// 1. Update 'planTasks' set isCompleted=true/false`<br>`// 2. **Trigger History Logging (see Section 5)**`<br>`// 3. Return updated task}` |

### 4\. AI Planning Engine Endpoint (The Core Logic)

This endpoint is typically an **internal service** triggered by the `/api/plan/inputs` POST request.

| Endpoint | Method | Role | Pseudocode/Description |
| :--- | :--- | :--- | :--- |
| **(Internal)** `/service/generate` | `POST` | Executes the AI plan generation process. | `async function generatePlan(preferenceId: number) {`<br>`// 1. Check & Decrement 'generationQuota'`<br>`// 2. Fetch User Context: 'goalsText', 'fixedCommitmentsJson', and 'userProductivityInsights'`<br>`// 3. **Construct the full prompt string** with all variables`<br>`// 4. Call external AI model via **OpenRouter SDK**`<br>`// 5. Parse JSON response & extract summary`<br>`// 6. Insert full response into 'monthlyPlans'`<br>`// 7. Extract tasks from JSON and bulk insert into 'planTasks' **(Crucial Step)**`<br>`// 8. Return plan ID}` |

### 5\. History & Insight Endpoints (For Personalization)

| Endpoint | Method | Role | Pseudocode/Description |
| :--- | :--- | :--- | :--- |
| **(Internal)** `/service/log-activity`| `POST` | Logs details when a task status is changed (`PATCH` in Section 3). | `async function logActivity(task: Task, completionDetails: object) {`<br>`// 1. Calculate duration deviation (planned vs. actual time)`<br>`// 2. Insert record into 'userActivityHistory'`<br>`// 3. **[Optional] Trigger Insight Recalculation**}` |
| **(Internal)** `/service/recalculate-insights` | `POST` | Analyzes historical data to update AI context. | `async function recalculateInsights(userId: number) {`<br>`// 1. Query 'userActivityHistory' for all data in the last 3-6 months`<br>`// 2. Run analysis functions (e.g., calculate 7-day rolling completion rate, identify peak energy hours)`<br>`// 3. Upsert (Update or Insert) new insights into 'userProductivityInsights' table`<br>`// 4. Return updated insights}` |

-----

### **Flow Summary**

1. **User Action:** User submits the form.
2. **External API Call:** Frontend calls `POST /api/plan/inputs`.
3. **Backend Process:** This endpoint saves the inputs, then calls the **Internal** `/service/generate` function.
4. **AI Engine:** The engine constructs the prompt using data from **4 tables** (`users`, `userGoalsAndPreferences`, `generationQuota`, `userProductivityInsights`), calls the AI, and saves the results into **2 tables** (`monthlyPlans`, `planTasks`).
5. **User Action:** User marks a task as complete.
6. **External API Call:** Frontend calls `PATCH /api/plan/tasks/:taskId`.
7. **Backend Process:** Updates `planTasks` and calls the **Internal** `/service/log-activity` function to update `userActivityHistory`. This ensures the AI gets smarter over time.
