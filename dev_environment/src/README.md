
---

## 🚀 Installation and Setup

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB of RAM available
- Port 5601 available on your machine

### Steps

1. **Start the development environment:**
   ```bash
   cd dev_environment
   docker compose up -d
   ```

2. **Wait for OpenSearch to be healthy:**
   ```bash
   docker compose ps
   # Wait until os1 shows "healthy" status
   ```

3. **Access the container:**
   ```bash
   docker exec -it dev_environment-osd-1 bash
   ```

4. **Start OpenSearch Dashboards server:**
   ```bash
   cd /home/node/kbn
   yarn start --no-base-path
   ```

5. **Wait for compilation:**
   - First time: ~60-90 seconds
   - You'll see: "bundles compiled successfully"

6. **Access the application:**
   - URL: http://localhost:5601
   - Username: `admin`
   - Password: `Wazuh-1234`
   - Navigate to: Menu → TO-DO plugin

---

## 🧪 Running Tests

### Backend Tests (40 tests)

```bash
# Inside the container
cd /home/node/kbn/plugins/custom_plugin
yarn test server/routes/todos.test.ts
```

**Coverage:**
- ✅ Create TODO endpoint
- ✅ Get all TODOs with pagination
- ✅ Get single TODO
- ✅ Update TODO status
- ✅ Delete TODO
- ✅ Search functionality
- ✅ Filter by status
- ✅ Statistics calculation
- ✅ Error handling

### Frontend Tests (11 tests)

```bash
# Inside the container
cd /home/node/kbn/plugins/custom_plugin
yarn test public/
```

**Coverage:**
- ✅ useTodos hook (4 tests)
- ✅ todoService HTTP client (4 tests)
- ✅ dateUtils utilities (7 tests)

### Run All Tests

```bash
yarn test
```

### Run Tests with Coverage

```bash
yarn test --coverage
```

---

## 🐛 Problems Encountered and Solutions

### 1. OpenSearch Eventual Consistency

**Problem:**  
When creating, updating, or deleting tasks, the statistics were not updating immediately because OpenSearch uses eventual consistency. The aggregations were calculated before the index was refreshed, resulting in stale data.

**Solution:**  
Added `refresh: true` parameter to all write operations (create, update, delete) to force an immediate index refresh before calculating statistics. This ensures that aggregations always reflect the latest state.

```typescript
await client.create({
  index: INDEX_NAME,
  id: id,
  body: todo,
  refresh: true,  // Force immediate refresh
});
```

### 2. Real-time UI Updates

**Problem:**  
After performing CRUD operations, the UI needed to update instantly while maintaining data consistency with the server. Initial implementations either made unnecessary API calls or showed stale data.

**Solution:**  
Implemented optimistic updates pattern:
1. Update UI immediately (optimistic)
2. Make API call in background
3. Backend returns updated statistics in the same response
4. Update stats from server response (no extra API call needed)
5. Rollback UI changes if operation fails

This approach provides instant feedback while maintaining data integrity.

### 3. Documentation and Learning Curve

**Problem:**  
OpenSearch Dashboards plugin development has limited documentation, especially for integrating React components with the platform's architecture. Finding examples for modern React patterns (hooks, TypeScript) was challenging.

**Solution:**  
- Studied OpenSearch Dashboards source code for patterns
- Reviewed Elastic documentation (since OpenSearch forked from Elastic)
- Experimented with different approaches in isolated components
- Leveraged TypeScript types to understand available APIs
- Used browser DevTools to inspect existing plugins

---

## 🎯 Design Decisions

### 1. No State Management Library

**Decision:** Direct React state management with custom hooks instead of Redux/Context API.

**Rationale:**  
- The application has a simple, linear data flow
- Only one main entity (TODOs) with straightforward relationships
- Custom `useTodos` hook centralizes all state logic
- Reduces bundle size and complexity
- Easier to understand and maintain for this scope

### 2. Optimistic Updates

**Decision:** Implement optimistic UI updates for all mutations.

**Rationale:**  
- Improves perceived performance significantly
- Users get instant feedback on their actions
- Backend still validates and can rollback if needed
- Essential for good UX in modern web applications

### 3. Server-side Statistics

**Decision:** Calculate statistics on the backend using OpenSearch aggregations.

**Rationale:**  
- Ensures accuracy even with filters and search applied
- Leverages OpenSearch's powerful aggregation capabilities
- Scales better with large datasets
- Reduces client-side computation
- Single source of truth for metrics

### 4. Separation of Concerns

**Decision:** Clear separation between components, hooks, services, and utilities.

**Rationale:**  
- Components focus only on presentation
- Hooks manage state and business logic
- Services handle API communication
- Utilities provide reusable helper functions
- Makes testing easier and more focused
- Improves code reusability

### 5. TypeScript Throughout

**Decision:** Use TypeScript for both frontend and backend with shared types.

**Rationale:**  
- Catch errors at compile time
- Better IDE support and autocompletion
- Self-documenting code through types
- Shared types ensure API contract consistency
- Easier refactoring and maintenance

---

## 🚀 Suggested Future Enhancements

### High Priority
1. **User Assignment**: Assign tasks to specific team members with role-based permissions
2. **Data Export**: Export tasks to CSV, PDF, or JSON formats for reporting

### Medium Priority
6. **Priority Levels**: Add priority flags (Critical, High, Medium, Low)
7. **Due Dates**: Set and track task deadlines with alerts
8. **Comments/Notes**: Add comments and discussion threads to tasks
9. **Audit Log**: Track all changes made to tasks with timestamps and users
10. **Advanced Filters**: Filter by multiple criteria simultaneously (date range, tags, assignee)

### Low Priority
14. **Task Dependencies**: Link tasks with dependencies and prerequisites
15. **Dark Mode**: Theme support matching OpenSearch Dashboards settings

---

## 📊 API Endpoints

### Base URL
```
/api/custom_plugin/todos
```

### Endpoints

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| `GET` | `/` | Get all TODOs | `page`, `limit`, `status`, `search` |
| `GET` | `/{id}/todo` | Get single TODO | - |
| `POST` | `/` | Create new TODO | - |
| `PATCH` | `/{id}/status` | Update TODO status | - |
| `DELETE` | `/{id}/delete` | Delete TODO | - |

### Response Format

All successful responses include:
```typescript
{
  success: boolean;
  data: Todo | Todo[];
  pagination?: PaginationInfo;
  stats: TodoStats;
}
```

---

## 📝 Data Model

### Todo Entity
```typescript
interface Todo {
  id: string;              // UUID
  title: string;           // Task title (required)
  description?: string;    // Task description (optional)
  status: 'planned' | 'completed';
  createdAt: string;       // ISO 8601 timestamp
}
```

### Statistics
```typescript
interface TodoStats {
  total: number;           // Total number of tasks
  completed: number;       // Number of completed tasks
  planned: number;         // Number of planned tasks
  completedPercentage: number;  // Percentage of completed tasks
  plannedPercentage: number;    // Percentage of planned tasks
}
```

---

## 📄 License

This plugin is developed for educational and evaluation purposes as part of a technical challenge for Wazuh.
