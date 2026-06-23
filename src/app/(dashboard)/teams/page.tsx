'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ROLE_HIERARCHY, type OrgRole } from '@/lib/permissions'
import { getTeamsAction, addTeamMemberAction, updateTeamMemberRoleAction, removeTeamMemberAction, getEmployeesForTeamAction } from './actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, Plus, Trash2 } from 'lucide-react'

interface Team {
  id: string
  name: string
  description: string | null
}

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  team_role: 'team_lead' | 'senior_member' | 'member' | 'guest'
}

const TEAM_ROLES = [
  { value: 'team_lead', label: 'Team Lead', color: 'bg-purple-500' },
  { value: 'senior_member', label: 'Senior Member', color: 'bg-blue-500' },
  { value: 'member', label: 'Member', color: 'bg-green-500' },
  { value: 'guest', label: 'Guest', color: 'bg-gray-500' },
]

export default function TeamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [userRole, setUserRole] = useState<OrgRole | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [availableEmployees, setAvailableEmployees] = useState<Array<{ id: string; email: string; full_name: string | null }>>([])
  
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedTeamRole, setSelectedTeamRole] = useState<'team_lead' | 'senior_member' | 'member' | 'guest'>('member')

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

        // Fetch teams
        const result = await getTeamsAction()
        if (result.success && result.teams) {
          setTeams(result.teams)
          if (result.teams.length > 0) {
            setSelectedTeam(result.teams[0])
          }
        }

        // Fetch all org employees
        const empResult = await getEmployeesForTeamAction()
        if (empResult.success && empResult.employees) {
          setAvailableEmployees(empResult.employees)
        }
      } catch (error) {
        console.error('Failed to initialize page:', error)
      }
    }

    initializePage()
  }, [])

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id)
    }
  }, [selectedTeam])

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const supabase = createClient()
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id, team_role')
        .eq('team_id', teamId)

      if (teamMembers) {
        const userIds = teamMembers.map((m) => m.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds)

        const membersData = teamMembers.map((member) => {
          const profile = profiles?.find((p) => p.id === member.user_id)
          return {
            id: member.user_id,
            email: profile?.email || '',
            full_name: profile?.full_name || null,
            team_role: member.team_role as 'team_lead' | 'senior_member' | 'member' | 'guest',
          }
        })

        setMembers(membersData)
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    }
  }

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedEmployee) return

    setLoading(true)
    try {
      const result = await addTeamMemberAction({
        teamId: selectedTeam.id,
        employeeId: selectedEmployee,
        teamRole: selectedTeamRole,
      })

      if (result.success) {
        setSelectedEmployee('')
        setShowAddMember(false)
        router.refresh()
        await fetchTeamMembers(selectedTeam.id)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: typeof selectedTeamRole) => {
    if (!selectedTeam) return

    setLoading(true)
    try {
      const result = await updateTeamMemberRoleAction({
        teamId: selectedTeam.id,
        memberId,
        newRole,
      })

      if (result.success) {
        await fetchTeamMembers(selectedTeam.id)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return

    setLoading(true)
    try {
      const result = await removeTeamMemberAction({
        teamId: selectedTeam.id,
        memberId,
      })

      if (result.success) {
        await fetchTeamMembers(selectedTeam.id)
      }
    } finally {
      setLoading(false)
    }
  }

  const canManageTeams = userRole === 'super_admin' || userRole === 'admin' || userRole === 'manager'

  if (!canManageTeams) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-white/60">Only managers and above can manage team members</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-gradient-to-br from-[#0d0d0d] to-[#1a1a1a]">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Team Management
          </h1>
          <p className="text-white/60">Organize employees and assign team-level roles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Teams List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden sticky top-8">
              <div className="p-4 border-b border-[#333] bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <span>🏢</span> Your Teams
                </h3>
              </div>
              <div className="p-3 max-h-96 overflow-y-auto">
                {teams.length === 0 ? (
                  <p className="text-white/40 text-sm py-4 text-center">No teams yet</p>
                ) : (
                  <div className="space-y-2">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                          selectedTeam?.id === team.id
                            ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-500/50 text-white'
                            : 'border border-transparent text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-white/50 mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="lg:col-span-3">
            {selectedTeam ? (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden">
                {/* Team Header */}
                <div className="p-6 border-b border-[#333] bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedTeam.name}</h2>
                      <p className="text-white/60 text-sm mt-1">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                      onClick={() => setShowAddMember(!showAddMember)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Member
                    </button>
                  </div>
                </div>

                {/* Add Member Form */}
                {showAddMember && (
                  <div className="p-6 border-b border-[#333] bg-[#0d0d0d]">
                    <h3 className="text-white font-semibold mb-4">Add Team Member</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employee" className="text-white font-medium block mb-2">
                          Select Employee
                        </Label>
                        <Select
                          value={selectedEmployee || ''}
                          onValueChange={(val: string | null) => {
                            if (val) setSelectedEmployee(val)
                          }}
                        >
                          <option value="">Choose an employee...</option>
                          {availableEmployees
                            .filter((emp) => !members.find((m) => m.id === emp.id))
                            .map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.full_name || emp.email}
                              </option>
                            ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="role" className="text-white font-medium block mb-2">
                          Team Role
                        </Label>
                        <Select
                          value={selectedTeamRole || 'member'}
                          onValueChange={(val: string | null) => {
                            if (val) setSelectedTeamRole(val as 'team_lead' | 'senior_member' | 'member' | 'guest')
                          }}
                        >
                          {TEAM_ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleAddMember}
                        disabled={loading || !selectedEmployee}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : '✓ Add Member'}
                      </button>
                      <button
                        onClick={() => setShowAddMember(false)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Members List */}
                <div className="p-6">
                  {members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="text-5xl mb-4">👥</div>
                      <p className="text-white/60">No members in this team</p>
                      <p className="text-white/40 text-sm mt-2">Add your first team member to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-[#222] rounded-lg hover:border-[#333] transition-all"
                        >
                          <div className="flex-1">
                            <p className="text-white font-medium">{member.full_name || 'N/A'}</p>
                            <p className="text-white/60 text-sm">{member.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <Select
                                value={member.team_role}
                                onValueChange={(val: any) => handleUpdateRole(member.id, val)}
                              >
                                {TEAM_ROLES.map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-2 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all text-red-400 hover:text-red-300"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">🏢</div>
                <p className="text-white/60 text-lg">Select a team to view and manage members</p>
                <p className="text-white/40 text-sm mt-2">Choose a team from the list on the left to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateTeamForm() {
  return null
}
