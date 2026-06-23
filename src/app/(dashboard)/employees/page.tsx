'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ROLE_HIERARCHY, ROLE_DISPLAY_NAMES, type OrgRole } from '@/lib/permissions'
import { RoleBadge } from '@/components/role-badge'
import { addEmployeeAction, importEmployeesAction, updateEmployeeRoleAction, getEmployeesAction, getRoleAuditLogsAction } from './actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, Search, Plus, Download } from 'lucide-react'

interface Employee {
  id: string
  email: string
  full_name: string | null
  role: OrgRole | 'unassigned'
}

export default function EmployeesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [userRole, setUserRole] = useState<OrgRole | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'employee' as OrgRole,
  })
  const [importFile, setImportFile] = useState<File | null>(null)

  useEffect(() => {
    const initializePage = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const { data: orgMembers } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (!orgMembers) return

        setOrgId(orgMembers.organization_id)
        setUserRole(orgMembers.role as OrgRole)

        const result = await getEmployeesAction()
        if (result.success && result.employees) {
          setEmployees(result.employees)
        }
      } catch (error) {
        console.error('Failed to initialize page:', error)
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

  const canAccess = userRole === 'super_admin' || userRole === 'manager'
  const isSuper = userRole === 'super_admin'
  
  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only managers and super admins can manage employees</p>
        </div>
      </div>
    )
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await addEmployeeAction({
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
      })
      if (result.success) {
        setFormData({ email: '', full_name: '', role: 'employee' })
        setShowAddForm(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) return
    
    setLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', importFile)
      const result = await importEmployeesAction(formDataToSend)
      if (result.success) {
        setImportFile(null)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (employeeId: string, newRole: OrgRole) => {
    setLoading(true)
    try {
      const result = await updateEmployeeRoleAction({
        employeeId,
        newRole,
      })
      if (result.success) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter and search
  const filteredEmployees = employees.filter(emp =>
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold font-heading text-foreground">Employees</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your team members and roles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Import CSV
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-8">
        <div className="max-w-7xl mx-auto w-full">
          {/* Add Form - Slide In */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">Add New Employee</h3>
              <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground block mb-2">Email</Label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground block mb-2">Full Name</Label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground block mb-2">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: string | null) => {
                      if (value) setFormData({ ...formData, role: value as OrgRole })
                    }}
                  >
                    {isSuper ? (
                      <>
                        <option value="viewer">Viewer</option>
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </>
                    ) : (
                      <>
                        <option value="viewer">Viewer</option>
                        <option value="employee">Employee</option>
                      </>
                    )}
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Adding...' : 'Add'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Select defaultValue="all">
                  <option value="all">All Departments</option>
                  <option value="engineering">Engineering</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                </Select>
              </div>
              <div className="flex-1">
                <Select defaultValue="all">
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Employee Count */}
          <div className="mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">EMPLOYEE</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">EMAIL</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">ROLE</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">STATUS</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground text-sm">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-5xl">👤</span>
                          <p className="text-muted-foreground">No employees found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${getAvatarColor(emp.email)}`}>
                              {getInitials(emp.full_name, emp.email)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{emp.full_name || 'Unknown'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-muted-foreground text-sm">{emp.email}</p>
                        </td>
                        <td className="py-4 px-6">
                          {emp.role === 'unassigned' ? (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                              Unassigned
                            </span>
                          ) : (
                            <RoleBadge role={emp.role as OrgRole} />
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <Select
                            value={emp.role}
                            onValueChange={(newRole: string | null) => {
                              if (newRole) handleRoleChange(emp.id, newRole as OrgRole)
                            }}
                          >
                            {emp.role === 'unassigned' && (
                              <option value="unassigned">Select Role...</option>
                            )}
                            {isSuper ? (
                              <>
                                <option value="viewer">Viewer</option>
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                              </>
                            ) : (
                              <>
                                <option value="viewer">Viewer</option>
                                <option value="employee">Employee</option>
                              </>
                            )}
                          </Select>
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
