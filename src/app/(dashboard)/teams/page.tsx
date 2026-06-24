'use client'

import { startTransition, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type OrgRole } from '@/lib/permissions'
import {
  getTeamsAction,
  createTeamAction,
  addTeamMemberAction,
  updateTeamMemberRoleAction,
  removeTeamMemberAction,
  getEmployeesForTeamAction,
} from './actions'
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
  role: 'team_lead' | 'senior_member' | 'member' | 'guest'
}

const TEAM_ROLES = [
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'senior_member', label: 'Senior Member' },
  { value: 'member', label: 'Member' },
  { value: 'guest', label: 'Guest' },
] as const

export default function TeamsPage() {
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [userRole, setUserRole] = useState<OrgRole | null>(null)
  const [availableEmployees, setAvailableEmployees] = useState<Array<{ id: string; email: string; full_name: string | null }>>([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedTeamRole, setSelectedTeamRole] = useState<TeamMember['role']>('member')
  const [newTeamData, setNewTeamData] = useState({ name: '', description: '', identifier: '' })

  async function fetchTeamMembers(teamId: string) {
    try {
      const supabase = createClient()
      const { data: teamMembers } = await supabase.from('team_members').select('user_id, role').eq('team_id', teamId)

      if (!teamMembers || teamMembers.length === 0) {
        setMembers([])
        return
      }

      const userIds = teamMembers.map((member) => member.user_id)
      const { data: profiles } = await supabase.from('profiles').select('id, email, full_name').in('id', userIds)
      const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]))

      setMembers(
        teamMembers.map((member) => {
          const profile = profileMap.get(member.user_id)
          return {
            id: member.user_id,
            email: profile?.email || '',
            full_name: profile?.full_name || null,
            role: member.role as TeamMember['role'],
          }
        })
      )
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    }
  }


  useEffect(() => {
    const initializePage = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (!orgMember) return
        setUserRole(orgMember.role as OrgRole)

        const [teamsResult, employeesResult] = await Promise.all([getTeamsAction(), getEmployeesForTeamAction()])

        if (teamsResult.success && teamsResult.teams) {
          setTeams(teamsResult.teams)
          const firstTeam = teamsResult.teams[0] ?? null
          setSelectedTeam(firstTeam)
          if (firstTeam) {
            await fetchTeamMembers(firstTeam.id)
          } else {
            setMembers([])
          }
        }

        if (employeesResult.success && employeesResult.employees) {
          setAvailableEmployees(employeesResult.employees)
        }
      } catch (error) {
        console.error('Failed to initialize page:', error)
      }
    }

    void initializePage()
  }, [])

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team)
    startTransition(() => {
      void fetchTeamMembers(team.id)
    })
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
        startTransition(() => {
          void fetchTeamMembers(selectedTeam.id)
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: TeamMember['role']) => {
    if (!selectedTeam) return

    setLoading(true)
    try {
      const result = await updateTeamMemberRoleAction({
        teamId: selectedTeam.id,
        memberId,
        newRole,
      })

      if (result.success) {
        startTransition(() => {
          void fetchTeamMembers(selectedTeam.id)
        })
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
        startTransition(() => {
          void fetchTeamMembers(selectedTeam.id)
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamData.name || !newTeamData.identifier) return

    setLoading(true)
    try {
      const result = await createTeamAction({
        name: newTeamData.name,
        description: newTeamData.description,
        identifier: newTeamData.identifier,
      })

      if (result.success) {
        setNewTeamData({ name: '', description: '', identifier: '' })
        setShowCreateTeam(false)
        startTransition(() => {
          void getTeamsAction().then((res) => {
            if (res.success) {
              setTeams(res.teams)
            }
          })
        })
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
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only managers and above can manage team members</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
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
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-8">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h3 className="text-foreground font-semibold">Your Teams</h3>
                <Button
                  onClick={() => setShowCreateTeam((current) => !current)}
                  size="sm"
                  variant="ghost"
                  className="gap-1 h-7"
                  title="Create new team"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {showCreateTeam && (
                <div className="p-4 border-b border-border bg-muted/20 space-y-3">
                  <Input
                    placeholder="Team name"
                    value={newTeamData.name}
                    onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                  />
                  <Input
                    placeholder="Identifier (e.g., ENG)"
                    value={newTeamData.identifier}
                    onChange={(e) => setNewTeamData({ ...newTeamData, identifier: e.target.value.toUpperCase() })}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newTeamData.description}
                    onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-16"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateTeam}
                      disabled={loading || !newTeamData.name || !newTeamData.identifier}
                      size="sm"
                      className="flex-1"
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </Button>
                    <Button onClick={() => setShowCreateTeam(false)} variant="outline" size="sm" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-3 max-h-96 overflow-y-auto">
                {teams.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No teams yet</p>
                ) : (
                  <div className="space-y-2">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleSelectTeam(team)}
                        className={`w-full text-left px-4 py-3 rounded transition-all duration-200 ${
                          selectedTeam?.id === team.id
                            ? 'bg-primary/10 border border-primary/30 text-foreground'
                            : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        }`}
                      >
                        <p className="font-medium text-sm">{team.name}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {selectedTeam?.id === team.id ? `${members.length} members` : team.description || ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedTeam ? (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedTeam.name}</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        {members.length} team member{members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button onClick={() => setShowAddMember((current) => !current)} size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Member
                    </Button>
                  </div>
                </div>

                {showAddMember && (
                  <div className="p-6 border-b border-border bg-muted/20">
                    <h3 className="text-foreground font-semibold mb-4">Add Team Member</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employee" className="text-foreground font-medium block mb-2">
                          Select Employee
                        </Label>
                        <select
                          id="employee"
                          value={selectedEmployee}
                          onChange={(event) => setSelectedEmployee(event.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Choose an employee...</option>
                          {availableEmployees
                            .filter((employee) => !members.find((member) => member.id === employee.id))
                            .map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.full_name || employee.email}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="role" className="text-foreground font-medium block mb-2">
                          Team Role
                        </Label>
                        <select
                          id="role"
                          value={selectedTeamRole}
                          onChange={(event) => setSelectedTeamRole(event.target.value as TeamMember['role'])}
                          className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          {TEAM_ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button onClick={handleAddMember} disabled={loading || !selectedEmployee} size="sm">
                        {loading ? 'Adding...' : 'Add Member'}
                      </Button>
                      <Button onClick={() => setShowAddMember(false)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
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
                            <select
                              value={member.role}
                              onChange={(event) => handleUpdateRole(member.id, event.target.value as TeamMember['role'])}
                              className="px-3 py-2 border border-border rounded-md bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              {TEAM_ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
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
                <p className="text-muted-foreground text-lg">Select a team to view and manage members</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}