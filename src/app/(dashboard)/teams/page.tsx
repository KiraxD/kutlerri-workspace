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
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-gradient-to-r from-blue-50 to-background">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">Team Management</h1>
            <p className="text-xs text-muted-foreground">Organize employees and assign team-level roles</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-8">
        <div className="max-w-6xl mx-auto w-full">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Teams List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-8">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="text-foreground font-semibold flex items-center gap-2">
                  <span>🏢</span> Your Teams
                </h3>
              </div>
              <div className="p-3 max-h-96 overflow-y-auto">
                {teams.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No teams yet</p>
                ) : (
                  <div className="space-y-2">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className={`w-full text-left px-4 py-3 rounded transition-all duration-200 ${
                          selectedTeam?.id === team.id
                            ? 'bg-primary/10 border border-primary/30 text-foreground'
                            : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        }`}
                      >
                        <p className="font-medium text-sm">{team.name}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
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
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Team Header */}
                <div className="p-6 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedTeam.name}</h2>
                      <p className="text-muted-foreground text-sm mt-1">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Button
                      onClick={() => setShowAddMember(!showAddMember)}
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Member
                    </Button>
                  </div>
                </div>

                {/* Add Member Form */}
                {showAddMember && (
                  <div className="p-6 border-b border-border bg-muted/20">
                    <h3 className="text-foreground font-semibold mb-4">Add Team Member</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employee" className="text-foreground font-medium block mb-2">
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
                        <Label htmlFor="role" className="text-foreground font-medium block mb-2">
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
                      <Button
                        onClick={handleAddMember}
                        disabled={loading || !selectedEmployee}
                        size="sm"
                      >
                        {loading ? 'Adding...' : '✓ Add Member'}
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

                {/* Members List */}
                <div className="p-6">
                  {members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="text-5xl mb-4">👥</div>
                      <p className="text-muted-foreground">No members in this team</p>
                      <p className="text-muted-foreground/70 text-sm mt-2">Add your first team member to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded hover:bg-muted/40 transition-all"
                        >
                          <div className="flex-1">
                            <p className="text-foreground font-medium">{member.full_name || 'N/A'}</p>
                            <p className="text-muted-foreground text-sm">{member.email}</p>
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
                              className="p-2 hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/40 rounded transition-all text-destructive hover:text-destructive"
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
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🏢</div>
                <p className="text-muted-foreground text-lg">Select a team to view and manage members</p>
                <p className="text-muted-foreground/70 text-sm mt-2">Choose a team from the list on the left to get started</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

function CreateTeamForm() {
  return null
}
