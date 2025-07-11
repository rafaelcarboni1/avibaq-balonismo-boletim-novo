// Rotas do sistema de voos para pilotos e agências

export const pilotoRoutes = {
  dashboard: '/piloto/dashboard',
  login: '/piloto/login',
  meusBaloes: '/piloto/meus-baloes',
  planejamento: '/piloto/planejamento',
  convites: '/piloto/convites',
  checklist: (vooId: string) => `/piloto/checklist/${vooId}`,
  posVoo: (vooId: string) => `/piloto/pos-voo/${vooId}`,
  historico: '/piloto/historico',
  trocarSenha: '/piloto/trocar-senha',
  novaSenha: '/piloto/nova-senha'
};

export const agenciaRoutes = {
  dashboard: '/agencia/dashboard',
  login: '/agencia/login',
  pilotos: '/agencia/pilotos',
  planejamento: '/agencia/planejamento',
  frota: '/agencia/frota',
  historico: '/agencia/historico',
  trocarSenha: '/agencia/trocar-senha',
  novaSenha: '/agencia/nova-senha'
};

export const adminRoutes = {
  dashboard: '/admin/dashboard',
  login: '/admin/login',
  usuarios: '/admin/usuarios',
  relatorios: '/admin/relatorios',
  configuracoes: '/admin/configuracoes',
  trocarSenha: '/admin/trocar-senha',
  definirSenha: '/admin/definir-senha'
};

// Menu items para cada tipo de usuário
export const pilotoMenuItems = [
  { label: 'Dashboard', href: pilotoRoutes.dashboard, icon: 'home' },
  { label: 'Planejar Voo', href: pilotoRoutes.planejamento, icon: 'plus' },
  { label: 'Meus Balões', href: pilotoRoutes.meusBaloes, icon: 'balloon' },
  { label: 'Convites', href: pilotoRoutes.convites, icon: 'mail' },
  { label: 'Histórico', href: pilotoRoutes.historico, icon: 'history' }
];

export const agenciaMenuItems = [
  { label: 'Dashboard', href: agenciaRoutes.dashboard, icon: 'home' },
  { label: 'Planejar Voo', href: agenciaRoutes.planejamento, icon: 'plus' },
  { label: 'Gerenciar Pilotos', href: agenciaRoutes.pilotos, icon: 'users' },
  { label: 'Frota', href: agenciaRoutes.frota, icon: 'balloon' },
  { label: 'Relatórios', href: agenciaRoutes.historico, icon: 'chart' }
];

// Função para verificar se uma rota é acessível pelo tipo de usuário
export const isRouteAccessible = (route: string, userRole: string): boolean => {
  if (userRole === 'piloto') {
    return route.startsWith('/piloto/');
  }
  if (userRole === 'agencia') {
    return route.startsWith('/agencia/');
  }
  if (['admin', 'meteo', 'tesouraria'].includes(userRole)) {
    return route.startsWith('/admin/');
  }
  return false;
};

// Função para obter a rota de redirecionamento baseada no role
export const getDefaultRouteForRole = (role: string): string => {
  switch (role) {
    case 'piloto':
      return pilotoRoutes.dashboard;
    case 'agencia':
      return agenciaRoutes.dashboard;
    case 'admin':
    case 'meteo':
    case 'tesouraria':
      return adminRoutes.dashboard;
    default:
      return '/';
  }
};