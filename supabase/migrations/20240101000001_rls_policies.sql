-----------------------------------------
-- Helper Functions for RLS
-----------------------------------------
-- Check if user is a member of an organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a member of a team
CREATE OR REPLACE FUNCTION is_team_member(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = t_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-----------------------------------------
-- RLS Policies
-----------------------------------------

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- USER_PREFERENCES
CREATE POLICY "Users can view own preferences."
  ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences."
  ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences."
  ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- NOTIFICATION_PREFERENCES
CREATE POLICY "Users can view own notification prefs."
  ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification prefs."
  ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification prefs."
  ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- ORGANIZATIONS
CREATE POLICY "Org members can view organizations."
  ON organizations FOR SELECT USING (is_org_member(id));
CREATE POLICY "Any authenticated user can create an org."
  ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Add update policy for admins/owners later (simplification for MVP: all members can update)
CREATE POLICY "Org members can update organizations."
  ON organizations FOR UPDATE USING (is_org_member(id));

-- ORGANIZATION_MEMBERS
CREATE POLICY "Org members can view other members."
  ON organization_members FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Org members can invite users."
  ON organization_members FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Users can leave org."
  ON organization_members FOR DELETE USING (auth.uid() = user_id);

-- TEAMS
CREATE POLICY "Org members can view teams."
  ON teams FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Org members can create teams."
  ON teams FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Org members can update teams."
  ON teams FOR UPDATE USING (is_org_member(organization_id));

-- TEAM_MEMBERS
CREATE POLICY "Org members can view team members."
  ON team_members FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "Org members can add to team."
  ON team_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND is_org_member(teams.organization_id))
  );

-- PROJECTS
CREATE POLICY "Team members can view projects."
  ON projects FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "Team members can create projects."
  ON projects FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY "Team members can update projects."
  ON projects FOR UPDATE USING (is_team_member(team_id));

-- MILESTONES
CREATE POLICY "Org members can view milestones."
  ON milestones FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Org members can create milestones."
  ON milestones FOR INSERT WITH CHECK (is_org_member(organization_id));

-- ROADMAP_ITEMS
CREATE POLICY "Org members can view roadmaps."
  ON roadmap_items FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Org members can create roadmaps."
  ON roadmap_items FOR INSERT WITH CHECK (is_org_member(organization_id));

-- CYCLES
CREATE POLICY "Team members can view cycles."
  ON cycles FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "Team members can manage cycles."
  ON cycles FOR ALL USING (is_team_member(team_id));

-- ISSUES
CREATE POLICY "Team members can view issues."
  ON issues FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "Team members can create issues."
  ON issues FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY "Team members can update issues."
  ON issues FOR UPDATE USING (is_team_member(team_id));

-- ISSUE_RELATIONS
CREATE POLICY "Team members can view issue relations."
  ON issue_relations FOR SELECT USING (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_id AND is_team_member(issues.team_id))
  );
CREATE POLICY "Team members can manage issue relations."
  ON issue_relations FOR ALL USING (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_id AND is_team_member(issues.team_id))
  );

-- LABELS
CREATE POLICY "Team members can view labels."
  ON labels FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "Team members can manage labels."
  ON labels FOR ALL USING (is_team_member(team_id));

-- ISSUE_LABELS
CREATE POLICY "Team members can view issue labels."
  ON issue_labels FOR SELECT USING (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_id AND is_team_member(issues.team_id))
  );
CREATE POLICY "Team members can manage issue labels."
  ON issue_labels FOR ALL USING (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_id AND is_team_member(issues.team_id))
  );

-- COMMENTS
CREATE POLICY "Team members can view comments."
  ON comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_id AND is_team_member(issues.team_id))
  );
CREATE POLICY "Team members can create comments."
  ON comments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_id AND is_team_member(issues.team_id))
  );
CREATE POLICY "Comment creators can update own comments."
  ON comments FOR UPDATE USING (user_id = auth.uid());

-- SAVED_VIEWS
CREATE POLICY "Users can manage own saved views."
  ON saved_views FOR ALL USING (user_id = auth.uid());

-- FAVORITES
CREATE POLICY "Users can manage own favorites."
  ON favorites FOR ALL USING (user_id = auth.uid());

-- ACTIVITY_EVENTS
CREATE POLICY "Org members can view activity."
  ON activity_events FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "System/Org members can insert activity."
  ON activity_events FOR INSERT WITH CHECK (is_org_member(organization_id));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications."
  ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications."
  ON notifications FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Users can update own notifications."
  ON notifications FOR UPDATE USING (user_id = auth.uid());
