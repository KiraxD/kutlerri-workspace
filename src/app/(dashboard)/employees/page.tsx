'use client'

import { startTransition, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RoleBadge } from '@/components/role-badge'
import { addEmployeeAction, importEmployeesAction, updateEmployeeRoleAction, getEmployeesAction } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, Download } from 'lucide-react'
import type { OrgRole } from '@/lib/permissions'

interface Employee {
  id: string
  email: string
  full_name: string | null
  role: OrgRole
}

export default function EmployeesPage() {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [userRole, setUserRole] = useState<OrgRole | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    role: 'employee' as OrgRole,
  })

  const loadEmployees = async () => {
    try {
      const result = await getEmployeesAction()
      if (result.success && result.employees) {
        setEmployees(result.employees)
        setStatusMessage(null)
        return
      }

      setStatusMessage(result.error || 'Failed to load employees')
    } catch (error: any) {
      console.error('Error loading employees:', error)
      setStatusMessage(error?.message || 'Failed to load employees')
    }
  }

  useEffect(() => {
    const initializePage = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setStatusMessage('Not authenticated')
          return
        }

        const { data: orgMember, error: orgError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (orgError) {
          console.error('Error fetching org member:', orgError)
          setStatusMessage(`Error fetching role: ${orgError.message}`)
          return
        }

        if (!orgMember) {
          setStatusMessage('No organization membership found')
          return
        }

        setUserRole(orgMember.role as OrgRole)
        await loadEmployees()
      } catch (error) {
        console.error('Failed to initialize page:', error)
        setStatusMessage(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    initializePage()
  }, [])

  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
          <p className="text-muted-foreground">Fetching your access level</p>
        </div>
      </div>
    )
  }

  const canAccess = userRole === 'super_admin' || userRole === 'admin' || userRole === 'manager'
  const isSuper = userRole === 'super_admin'

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only managers and above can manage employees</p>
        </div>
      </div>
    )
  }

  const handleAddEmployee = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setStatusMessage(null)

    try {
      const result = await addEmployeeAction({
        email: formData.email,
        full_name: '',
        role: formData.role,
      })

      if (result.success) {
        setFormData({ email: '', role: 'employee' })
        setShowAddForm(false)
        startTransition(() => {
          void loadEmployees()
        })
        setStatusMessage('Employee role assigned successfully')
      } else {
        setStatusMessage(result.error || 'Failed to add employee')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!importFile) return

    setLoading(true)
    setStatusMessage(null)

    try {
      const payload = new FormData()
      payload.append('file', importFile)
      const result = await importEmployeesAction(payload)

      if (result.success) {
        setImportFile(null)
        setShowImportForm(false)
        startTransition(() => {
          void loadEmployees()
        })
        setStatusMessage(`Imported ${result.imported ?? 0} employees${result.errors?.length ? ` with ${result.errors.length} warnings` : ''}`)
      } else {
        setStatusMessage(result.error || 'Failed to import employees')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (employeeId: string, newRole: OrgRole) => {
    setLoading(true)
    setStatusMessage(null)

    try {
      const result = await updateEmployeeRoleAction({
        employeeId,
        newRole,
      })

      if (result.success) {
        startTransition(() => {
          void loadEmployees()
        })
        setStatusMessage('Employee role updated successfully')
      } else {
        setStatusMessage(result.error || 'Failed to update role')
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter((employee) =>
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    return email.slice(0, 2).toUpperCase()
  }

  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700',
      'bg-pink-100 text-pink-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-indigo-100 text-indigo-700',
    ]
    return colors[email.charCodeAt(0) % colors.length]
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold font-heading text-foreground">Employees</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage members who already have Kutlerri accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowImportForm((current) => !current)}>
            <Download className="w-4 h-4" />
            Import CSV
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowAddForm((current) => !current)}>
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-8">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          {statusMessage && (
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
              {statusMessage}
            </div>
          )}

          {showAddForm && (
            <div className="p-8 bg-card border border-border rounded-lg">
              <h3 className="text-2xl font-bold text-foreground mb-2">Add Existing User</h3>
              <p className="text-sm text-muted-foreground mb-6">The person must sign up first. This screen only assigns them to your organization.</p>
              <form onSubmit={handleAddEmployee} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-foreground block mb-3">Email</Label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground block mb-3">Role</Label>
                    <select
                      value={formData.role}
                      onChange={(event) => setFormData({ ...formData, role: event.target.value as OrgRole })}
                      className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      {isSuper && <option value="admin">Admin</option>}
                      {isSuper && <option value="super_admin">Super Admin</option>}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="px-6">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="px-8">
                    {loading ? 'Assigning...' : 'Assign Role'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {showImportForm && (
            <div className="p-8 bg-card border border-border rounded-lg">
              <h3 className="text-2xl font-bold text-foreground mb-2">Import Existing Users</h3>
              <p className="text-sm text-muted-foreground mb-6">Upload a spreadsheet with `email` and optional `role` columns. Each user must already have signed up.</p>
              <form onSubmit={handleImport} className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-foreground block mb-3">Spreadsheet</Label>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowImportForm(false)} className="px-6">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !importFile} className="px-8">
                    {loading ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search name, email, role..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">EMPLOYEE</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">EMAIL</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">ROLE</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className="text-muted-foreground">No employees found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${getAvatarColor(employee.email)}`}>
                              {getInitials(employee.full_name, employee.email)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{employee.full_name || 'Unknown'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-muted-foreground text-sm">{employee.email}</p>
                        </td>
                        <td className="py-4 px-6">
                          <RoleBadge role={employee.role} />
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={employee.role}
                            onChange={(event) => handleRoleChange(employee.id, event.target.value as OrgRole)}
                            className="px-3 py-1 border border-border rounded-md bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            {isSuper && <option value="admin">Admin</option>}
                            {isSuper && <option value="super_admin">Super Admin</option>}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
