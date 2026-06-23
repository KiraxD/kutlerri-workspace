'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ROLE_HIERARCHY, ROLE_DISPLAY_NAMES, type OrgRole } from '@/lib/permissions'
import { RoleBadge } from '@/components/role-badge'
import { addEmployeeAction, importEmployeesAction, updateEmployeeRoleAction, getEmployeesAction } from './actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Employee {
  id: string
  email: string
  full_name: string | null
  role: OrgRole
}

export default function EmployeesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'import'>('list')
  const [userRole, setUserRole] = useState<OrgRole | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  
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

        // Get user's organization and role
        const { data: orgMembers } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (!orgMembers) return

        setOrgId(orgMembers.organization_id)
        setUserRole(orgMembers.role as OrgRole)

        // Fetch employees
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
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
          <p className="text-white/60">Fetching your access level</p>
        </div>
      </div>
    )
  }

  // Only super_admin and manager can access
  const canAccess = userRole === 'super_admin' || userRole === 'manager'
  const isSuper = userRole === 'super_admin'
  
  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-white/60">Only managers and super admins can manage employees</p>
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
        setActiveTab('list')
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
        setActiveTab('list')
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

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Employee Management</h1>
          <p className="text-white/60">Manage team members and assign roles</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#222]">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'add'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Add Employee
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Import XLS
          </button>
        </div>

        {/* Content */}
        {activeTab === 'list' && (
          <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-6">
            <div className="space-y-2">
              {employees.length === 0 ? (
                <p className="text-white/60">No employees yet</p>
              ) : (
                employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded border border-[#222]"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{emp.full_name || emp.email}</p>
                      <p className="text-white/60 text-sm">{emp.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={emp.role} />
                      <Select
                        value={emp.role}
                        onValueChange={(newRole) =>
                          handleRoleChange(emp.id, newRole as OrgRole)
                        }
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
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-6 max-w-md">
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="employee@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="bg-[#0d0d0d] border-[#333] text-white"
                />
              </div>
              <div>
                <Label htmlFor="full_name" className="text-white">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="bg-[#0d0d0d] border-[#333] text-white"
                />
              </div>
              <div>
                <Label htmlFor="role" className="text-white">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as OrgRole })
                  }
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
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Adding...' : 'Add Employee'}
              </Button>
            </form>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-6 max-w-md">
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <Label htmlFor="file" className="text-white">
                  XLS File
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  required
                  className="bg-[#0d0d0d] border-[#333] text-white"
                />
                <p className="text-white/60 text-sm mt-2">
                  File should have columns: email, full_name, role
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading || !importFile}
                className="w-full"
              >
                {loading ? 'Importing...' : 'Import Employees'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
