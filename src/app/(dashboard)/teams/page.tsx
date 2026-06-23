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
    <div className="flex-1 flex flex-col p-6">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-8 h-8 text-[#9F7CEF]" />
            <h1 className="text-3xl font-bold text-white">Team Management</h1>
          </div>
          <p className="text-white/60">Manage team members and assign individual roles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Teams Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Teams</h3>
              <div className="space-y-2">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'bg-[#9F7CEF]/15 text-[#9F7CEF]'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <p className="font-medium text-sm">{team.name}</p>
                    <p className="text-xs text-white/40">{members.length} members</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="lg:col-span-3">
            {selectedTeam ? (
              <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{selectedTeam.name} Members</h3>
                  <Button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="gap-2"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Member
                  </Button>
                </div>

                {showAddMember && (
                  <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-4 mb-4 space-y-3">
                    <div>
                      <Label htmlFor="employee" className="text-white text-sm">
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
                      <Label htmlFor="role" className="text-white text-sm">
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
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddMember}
                        disabled={loading || !selectedEmployee}
                        size="sm"
                      >
                        {loading ? 'Adding...' : 'Add Member'}
                      </Button>
                      <Button
                        onClick={() => setShowAddMember(false)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {members.length === 0 ? (
                    <p className="text-white/60 text-center py-4">No members in this team</p>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded border border-[#222] hover:border-[#333] transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{member.full_name || member.email}</p>
                          <p className="text-white/40 text-xs">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
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
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 hover:bg-red-500/10 rounded transition-colors text-red-500"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-6 text-center">
                <p className="text-white/60">Select a team to view members</p>
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
