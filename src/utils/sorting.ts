import { Agent, Sort } from '../types/agent';

const statusOrder: Record<string, number> = {
  error: 0,
  busy: 1,
  online: 2,
  offline: 3,
};

export function sortAgents(agents: Agent[], sort: Sort): Agent[] {
  return [...agents].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sort.field) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'status':
        aVal = statusOrder[a.status];
        bVal = statusOrder[b.status];
        break;
      case 'last_activity':
        aVal = new Date(a.last_activity).getTime();
        bVal = new Date(b.last_activity).getTime();
        break;
      case 'uptime':
        aVal = a.uptime_seconds;
        bVal = b.uptime_seconds;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sort.order === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.order === 'asc' ? 1 : -1;
    return 0;
  });
}

export function filterAgents(agents: Agent[], search: string, statusFilter: string): Agent[] {
  return agents.filter((agent) => {
    // Search filter
    const matchesSearch =
      search === '' ||
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.session_id.toLowerCase().includes(search.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}
