Referencia de API

Prefijo de todas las rutas: /api.

Todos los endpoints excepto login requieren el header Authorization: Bearer &lt;token&gt; (Sanctum).

Los campos marcados con \* son obligatorios al crear.

# Autenticación

<div class="joplin-table-wrapper"><table><thead><tr><th><p><strong>Verbo</strong></p></th><th><p><strong>Endpoint</strong></p></th><th><p><strong>Parámetros</strong></p></th></tr></thead><tbody><tr><td><p>POST</p></td><td><pre><code>/api/login</code></pre></td><td><p>email*, password*, device_name (string, máx. 255)</p></td></tr><tr><td><p>GET</p></td><td><pre><code>/api/user</code></pre></td><td><p>—</p></td></tr><tr><td><p>POST</p></td><td><pre><code>/api/logout</code></pre></td><td><p>—</p></td></tr></tbody></table></div>

login está limitado a 6 intentos por minuto y devuelve token y user.

# Roles y permisos

<div class="joplin-table-wrapper"><table><thead><tr><th><p><strong>Verbo</strong></p></th><th><p><strong>Endpoint</strong></p></th><th><p><strong>Parámetros</strong></p></th></tr></thead><tbody><tr><td><p>PUT</p></td><td><pre><code>/api/roles/{role}/permissions</code></pre></td><td><p>permission_ids* (arreglo de ids, puede ir vacío)</p></td></tr><tr><td><p>PUT</p></td><td><pre><code>/api/users/{user}/roles</code></pre></td><td><p>role_ids* (arreglo de ids, puede ir vacío)</p></td></tr></tbody></table></div>

# Recursos CRUD

Cada recurso de la sección siguiente expone los mismos cinco endpoints:

<div class="joplin-table-wrapper"><table><thead><tr><th><p><strong>Verbo</strong></p></th><th><p><strong>Endpoint</strong></p></th><th><p><strong>Parámetros</strong></p></th></tr></thead><tbody><tr><td><p>GET</p></td><td><pre><code>/api/{recurso}</code></pre></td><td><p>query per_page (1–100, por defecto 15) y page</p></td></tr><tr><td><p>GET</p></td><td><pre><code>/api/{recurso}/{id}</code></pre></td><td><p>—</p></td></tr><tr><td><p>POST</p></td><td><pre><code>/api/{recurso}</code></pre></td><td><p>campos del recurso</p></td></tr><tr><td><p>PUT / PATCH</p></td><td><pre><code>/api/{recurso}/{id}</code></pre></td><td><p>los mismos campos, todos opcionales</p></td></tr><tr><td><p>DELETE</p></td><td><pre><code>/api/{recurso}/{id}</code></pre></td><td><p>— (responde 204)</p></td></tr></tbody></table></div>

# Campos por recurso

Los campos \*\_id son enteros que deben existir en su tabla. Donde aparece user_id, si no se envía se usa el usuario autenticado.

<div class="joplin-table-wrapper"><table><thead><tr><th><p><strong>Recurso</strong></p></th><th><p><strong>Campos</strong></p></th></tr></thead><tbody><tr><td><pre><code>users</code></pre></td><td><p>name* (máx. 255), email* (único), password* (mín. 8)</p></td></tr><tr><td><pre><code>roles</code></pre></td><td><p>name* (máx. 50, único), description (máx. 100)</p></td></tr><tr><td><pre><code>permissions</code></pre></td><td><p>name* (máx. 50, único), description (máx. 100)</p></td></tr><tr><td><pre><code>species</code></pre></td><td><p>name* (máx. 50), description* (máx. 50)</p></td></tr><tr><td><pre><code>breeds</code></pre></td><td><p>species_id*, name* (máx. 50), description* (máx. 50)</p></td></tr><tr><td><pre><code>colors</code></pre></td><td><p>name* (máx. 50), hex_color (máx. 10)</p></td></tr><tr><td><pre><code>pet-statuses</code></pre></td><td><p>name* (máx. 50)</p></td></tr><tr><td><pre><code>adoption-statuses</code></pre></td><td><p>name* (máx. 50)</p></td></tr><tr><td><pre><code>appointment-types</code></pre></td><td><p>name* (máx. 50)</p></td></tr><tr><td><pre><code>treatment-types</code></pre></td><td><p>name* (máx. 50)</p></td></tr><tr><td><pre><code>shelters</code></pre></td><td><p>name* (máx. 50), address* (máx. 150), phone (máx. 150), email</p></td></tr><tr><td><pre><code>residences</code></pre></td><td><p>animal_limit* (entero 0–32767), name (máx. 50)</p></td></tr><tr><td><pre><code>occupations</code></pre></td><td><p>name* (máx. 50), formalidad* (máx. 50), horarios* (máx. 100)</p></td></tr><tr><td><pre><code>people</code></pre></td><td><p>name* (máx. 50), document_type* (DPI o PASSPORT), document_number* (máx. 25, único), email*, estado_civil* (máx. 50), cantidad_hijos* (0–99), occupation_id*, residence_id*, income* (entero ≥ 0), current_pets_count (entero ≥ 0)</p></td></tr><tr><td><pre><code>donors</code></pre></td><td><p>name* (máx. 100), person_id*</p></td></tr><tr><td><pre><code>treatments</code></pre></td><td><p>name* (máx. 100), requires_veterinarian* (booleano), cost* (0–999999.99), treatment_type_id*</p></td></tr><tr><td><pre><code>pets</code></pre></td><td><p>name* (máx. 50), species_id*, breed_id* (debe pertenecer a la especie), sex* (M o F), birth_date* (fecha ≤ hoy), color_id*, pet_status_id*, registered_at* (fecha), shelter_id*, estimated_age (0–100), weight_kg (0–999.99), notes, status (active o inactive)</p></td></tr><tr><td><pre><code>pet-histories</code></pre></td><td><p>pet_id*, pet_status_id*, notes*, recorded_at* (fecha), user_id</p></td></tr><tr><td><pre><code>pet-treatments</code></pre></td><td><p>pet_id*, treatment_id*, instructions*, treated_at* (fecha)</p></td></tr><tr><td><pre><code>appointments</code></pre></td><td><p>pet_id*, appointment_date* (fecha), appointment_type_id*, person_id*, notes, status (pending, completed o missed), user_id</p></td></tr><tr><td><pre><code>donations</code></pre></td><td><p>donor_id*, amount* (0–99999999.99), contribution_type* (cash, transfer o in_kind), pet_id</p></td></tr><tr><td><pre><code>rescues</code></pre></td><td><p>pet_id*, pet_status_id*, rescued_at* (fecha), notes, user_id</p></td></tr><tr><td><pre><code>adoptions</code></pre></td><td><p>pet_id*, person_id*, requested_at* (fecha), adoption_status_id*, approved_at (fecha), delivered_at (fecha), notes, document (máx. 255), user_id</p></td></tr><tr><td><pre><code>adoption-follow-ups</code></pre></td><td><p>adoption_id*, followed_at* (fecha), notes*, user_id</p></td></tr><tr><td><pre><code>contracts</code></pre></td><td><p>adoption_id*, name* (máx. 100), document_path (máx. 255), user_id</p></td></tr></tbody></table></div>
# Flujo de adopción y área del adoptante

- `GET /api/user`, `POST /api/login` y `POST /api/register` devuelven `permissions`, la lista de permisos de la cuenta. `register` crea cuentas con el rol Adoptante.
- `GET /api/pets?available=1`: solo mascotas activas en un estado adoptable.
- `GET /api/adoptions/{id}` incluye `next_statuses`: pasos disponibles como `{status, label, blocker}`.
- `POST /api/adoptions/{id}/transition` (`manage_adoptions`): cuerpo `{status*, notes}`. Es la forma de cambiar el estado; un `PUT` solo acepta los mismos pasos del flujo.
- `adoption-statuses`, `occupations`, `residences`, `appointment-types` y `treatment-types`: la lectura solo exige sesión; escribir exige el permiso del módulo.
- `GET /api/public/my-applications?email=&document_number=`: exige ambos datos, devuelve solo el avance del trámite y admite 10 consultas por minuto.

Rutas con el permiso `adopt`, sobre la persona vinculada a la cuenta:

- `GET /api/my/adoptions`, `POST /api/my/adoptions` (`pet_id*`, `notes`) y `POST /api/my/adoptions/{id}/cancel` (solo pendientes).
- `GET /api/my/profile` y `PUT /api/my/profile`. Sin perfil, solicitar una adopción responde 422 con el error `profile`.
