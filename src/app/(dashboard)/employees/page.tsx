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
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'import' | 'audit'>('list')
  const [userRole, setUserRole] = useState<OrgRole | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  
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

  const loadAuditLogs = async () => {
    try {
      const result = await getRoleAuditLogsAction()
      if (result.success) {
        setAuditLogs(result.logs)
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-gradient-to-br from-[#0d0d0d] to-[#1a1a1a]">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Employee Management
              </h1>
              <p className="text-white/60">Manage team members and assign roles</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[#1a1a1a] p-1 rounded-lg w-fit">
          {[
            { id: 'list', label: 'Employees', icon: '👥' },
            { id: 'add', label: 'Add Employee', icon: '➕' },
            { id: 'import', label: 'Import XLS', icon: '📊' },
            { id: 'audit', label: 'Audit Log', icon: '📋' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any)
                if (tab.id === 'audit') loadAuditLogs()
              }}
              className={`px-6 py-2.5 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'list' && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">All Employees</h2>
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-sm text-purple-300">
                {employees.length} total
              </span>
            </div>

            {employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-5xl mb-4">👤</div>
                <p className="text-white/60 text-lg">No employees yet</p>
                <p className="text-white/40 text-sm mt-2">Add your first employee to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-4 px-4 font-semibold text-white/80">Name</th>
                      <th className="text-left py-4 px-4 font-semibold text-white/80">Email</th>
                      <th className="text-left py-4 px-4 font-semibold text-white/80">Current Role</th>
                      <th className="text-left py-4 px-4 font-semibold text-white/80">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} className="border-b border-[#222] hover:bg-[#0d0d0d] transition-colors">
                        <td className="py-4 px-4">
                          <p className="text-white font-medium">{emp.full_name || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-white/60 text-sm">{emp.email}</p>
                        </td>
                        <td className="py-4 px-4">
                          {emp.role === 'unassigned' ? (
                            <span className="px-3 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full text-xs font-semibold text-gray-300">
                              Unassigned
                            </span>
                          ) : (
                            <RoleBadge role={emp.role as OrgRole} />
                          )}
                        </td>
                        <td className="py-4 px-4">
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 shadow-xl max-w-md">
            <h2 className="text-xl font-semibold text-white mb-6">Add New Employee</h2>
            <form onSubmit={handleAddEmployee} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-white font-medium block mb-2">
                  Email Address
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
                  className="bg-[#0d0d0d] border-[#333] text-white placeholder:text-white/30 w-full"
                />
              </div>
              <div>
                <Label htmlFor="full_name" className="text-white font-medium block mb-2">
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
                  className="bg-[#0d0d0d] border-[#333] text-white placeholder:text-white/30 w-full"
                />
              </div>
              <div>
                <Label htmlFor="role" className="text-white font-medium block mb-2">
                  Role
                </Label>
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Adding...' : '➕ Add Employee'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 shadow-xl max-w-md">
            <h2 className="text-xl font-semibold text-white mb-6">Import Employees</h2>
            <form onSubmit={handleImport} className="space-y-5">
              <div className="border-2 border-dashed border-[#333] rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
                <div className="text-4xl mb-3">📄</div>
                <Label htmlFor="file" className="text-white font-medium block mb-2">
                  Choose XLS File
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  required
                  className="bg-[#0d0d0d] border-[#333] text-white w-full"
                />
                <p className="text-white/60 text-sm mt-3">
                  File should have columns: email, full_name, role
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || !importFile}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Importing...' : '📊 Import Employees'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6">Role Change History</h2>
            {auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-white/60">No role changes yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-4 bg-[#0d0d0d] border border-[#222] rounded-lg hover:border-[#333] transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-white font-medium">{log.user?.email}</p>
                        <p className="text-white/60 text-sm capitalize mt-1">
                          {log.action_type.replace(/_/g, ' ')}
                        </p>
                        {log.old_role && (
                          <p className="text-purple-300 text-sm mt-2">
                            {log.old_role} → {log.new_role}
                          </p>
                        )}
                        {log.team?.name && (
                          <p className="text-blue-300 text-sm mt-1">
                            Team: {log.team.name}
                          </p>
                        )}
                      </div>
                      <p className="text-white/40 text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
