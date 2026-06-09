/* ============================================
   CONECTA JÁ — INTERNATIONALISATION (i18n)
   Supports: Português (pt) · English (en)
   Strategy: text-node replacement + page reload
============================================ */
'use strict';

const I18n = (function () {
  const KEY = 'cj-lang';

  /* ------------------------------------------
     TRANSLATION DICTIONARY  (PT → EN)
     Keys must match the exact trimmed text
     content visible in the DOM.
  ------------------------------------------ */
  const dict = {

    /* ── NAVBAR ── */
    'Início': 'Home',
    'Prestadores': 'Providers',
    'Sobre': 'About',
    'Contacto': 'Contact',
    'Ver Prestadores': 'See Providers',
    'Entrar': 'Sign In',
    'Registar': 'Register',
    'Sair': 'Log Out',
    'Abrir menu': 'Open menu',
    'Alternar tema': 'Toggle theme',
    'Modo escuro': 'Dark mode',
    'Modo claro': 'Light mode',
    'Mudar idioma': 'Change language',

    /* ── FOOTER ── */
    'Serviços': 'Services',
    'Todos os Prestadores': 'All Providers',
    'Categorias': 'Categories',
    'Como Funciona': 'How It Works',
    'Empresa': 'Company',
    'Sobre Nós': 'About Us',
    'Blog': 'Blog',
    'Carreiras': 'Careers',
    'Suporte': 'Support',
    'Ajuda': 'Help',
    'Termos de Uso': 'Terms of Use',
    'Privacidade': 'Privacy',
    'Segurança': 'Security',
    'Todos os direitos reservados.': 'All rights reserved.',
    '© 2026 Conecta Já. Todos os direitos reservados.': '© 2026 Conecta Já. All rights reserved.',

    /* ── COMMON BUTTONS ── */
    'Começar Agora — Grátis': 'Get Started — Free',
    'Buscar': 'Search',
    'Pesquisar': 'Search',
    'Ver Perfil': 'View Profile',
    'Ler mais': 'Read more',
    'Ler Artigo': 'Read Article',
    'Enviar Mensagem': 'Send Message',
    'Continuar no WhatsApp': 'Continue on WhatsApp',
    'Abrir no Google Maps': 'Open in Google Maps',
    'Procurar Prestadores': 'Find Providers',
    'Quero Oferecer Serviços': 'I Want to Offer Services',
    'Ver todas as categorias': 'View all categories',
    'Guardar': 'Save',
    'Guardar Alterações': 'Save Changes',
    'Cancelar': 'Cancel',
    'Fechar': 'Close',
    'Editar': 'Edit',
    'Eliminar': 'Delete',
    'Confirmar': 'Confirm',
    'Reportar via WhatsApp': 'Report via WhatsApp',
    'Enviar Email': 'Send Email',
    'Novo Pedido': 'New Request',
    'Marcar todas lidas': 'Mark all as read',
    'Registar-me': 'Register',
    '+ Registar-me': '+ Register',

    /* ── COMMON BADGES / LABELS ── */
    'Disponível': 'Available',
    'Ocupado': 'Busy',
    'Verificado': 'Verified',
    'A carregar…': 'Loading…',
    'A carregar': 'Loading',
    'Sem notificações.': 'No notifications.',
    'Em tempo real': 'Real-time',
    'Desde': 'From',
    'Online': 'Online',
    'Anterior': 'Previous',
    'Próximo': 'Next',
    'Fechado': 'Closed',
    'Outro': 'Other',

    /* ── CATEGORIES ── */
    'Casa e Construção': 'Home & Construction',
    'Tecnologia': 'Technology',
    'Educação': 'Education',
    'Beleza e Bem-estar': 'Beauty & Wellness',
    'Eventos': 'Events',
    'Limpeza': 'Cleaning',
    'Transporte': 'Transport',
    'Saúde': 'Health',
    'Canalizador': 'Plumber',
    'Electricista': 'Electrician',
    'Eletricista': 'Electrician',
    'Pintor': 'Painter',
    'Mecânico': 'Mechanic',
    'Fotógrafo': 'Photographer',
    'Jardineiro': 'Gardener',
    'Designer': 'Designer',
    'Carpinteiro': 'Carpenter',
    'Informático': 'IT Technician',
    'Professor': 'Teacher',
    'Técnico IT': 'IT Technician',

    /* ── SERVICE CATEGORIES (descriptions) ── */
    'Canalizadores, eletricistas, pintores, pedreiros, carpinteiros': 'Plumbers, electricians, painters, masons, carpenters',
    'Reparação de telemóveis, computadores, redes, programação': 'Mobile phone, computer, network repair, programming',
    'Professores particulares, explicadores, cursos profissionais': 'Private tutors, instructors, professional courses',
    'Cabeleireiros, barbeiros, manicures, esteticistas, massagistas': 'Hairdressers, barbers, manicurists, estheticians, masseurs',
    'Fotógrafos, DJs, decoradores, catering, organização de eventos': 'Photographers, DJs, decorators, catering, event planning',
    'Limpeza doméstica, escritórios, pós-obra, jardinagem': 'Home cleaning, offices, post-construction, gardening',
    'Motoristas, mudanças, entregas, logística': 'Drivers, moving, deliveries, logistics',
    'Enfermeiros, fisioterapeutas, nutricionistas, personal trainers': 'Nurses, physiotherapists, nutritionists, personal trainers',

    /* ── INDEX: HERO ── */
    'Plataforma #1 em Angola • Lançamento 2026': 'Platform #1 in Angola • Launch 2026',
    'Melhores Prestadores': 'Best Providers',
    'de Serviços em Angola': 'of Services in Angola',
    'Encontra profissionais verificados e de confiança para qualquer serviço. Rápido, seguro e transparente. Mais de 5.000 prestadores prontos para te ajudar.': 'Find verified and trusted professionals for any service. Fast, safe and transparent. Over 5,000 providers ready to help you.',
    'Serviços Realizados': 'Services Completed',
    'Avaliação Média': 'Average Rating',
    'Satisfação': 'Satisfaction',
    'Todos os prestadores são verificados e aprovados pela nossa equipa': 'All providers are verified and approved by our team',

    /* ── INDEX: SEARCH ── */
    'O que precisas hoje?': 'What do you need today?',
    'Pesquisa por serviço, categoria ou localização': 'Search by service, category or location',
    'Populares:': 'Popular:',
    'Técnico': 'Technician',

    /* ── INDEX: CATEGORIES SECTION ── */
    'Explora por Categoria': 'Explore by Category',
    'Mais de 50 categorias de serviços profissionais à tua disposição em todo Angola': 'Over 50 categories of professional services available across Angola',
    '680+ prestadores': '680+ providers',
    '450+ prestadores': '450+ providers',
    '1.200+ prestadores': '1,200+ providers',
    '600+ prestadores': '600+ providers',
    '380+ prestadores': '380+ providers',
    '520+ prestadores': '520+ providers',
    '290+ prestadores': '290+ providers',
    '340+ prestadores': '340+ providers',

    /* ── INDEX: HOW IT WORKS ── */
    'Como Funciona?': 'How Does It Work?',
    'Três passos simples para encontrar o profissional perfeito': 'Three simple steps to find the perfect professional',
    'Pesquisa o Serviço': 'Search for the Service',
    'Usa a nossa busca avançada para encontrar o prestador ideal.': 'Use our advanced search to find the ideal provider.',
    'Busca inteligente': 'Smart search',
    'Filtros avançados': 'Advanced filters',
    'Perfis verificados': 'Verified profiles',
    'Conecta e Negoceia': 'Connect and Negotiate',
    'Contacta directamente com o prestador via WhatsApp ou telefone.': 'Contact the provider directly via WhatsApp or phone.',
    'Orçamentos grátis': 'Free quotes',
    'Contacto directo': 'Direct contact',
    'Agendamento flexível': 'Flexible scheduling',
    'Avalia o Serviço': 'Rate the Service',
    'Após a conclusão do trabalho, deixa a tua avaliação honesta.': 'After the job is done, leave your honest review.',
    'Sistema de avaliação': 'Rating system',
    'Feedback transparente': 'Transparent feedback',
    'Garantia de qualidade': 'Quality guarantee',

    /* ── INDEX: TESTIMONIALS ── */
    'O que dizem os nossos clientes': 'What Our Clients Say',
    'Histórias reais de pessoas que encontraram os melhores profissionais': 'Real stories from people who found the best professionals',

    /* ── INDEX: TRUST ── */
    'Por que Confiar no Conecta Já?': 'Why Trust Conecta Já?',
    'Somos a plataforma mais segura e confiável de Angola.': "We are Angola's safest and most reliable platform.",
    'Todos os nossos prestadores passam por verificação rigorosa antes de serem aprovados.': 'All our providers go through rigorous verification before being approved.',
    'Verificação de Identidade': 'Identity Verification',
    'Todos os documentos são verificados pela nossa equipa antes da aprovação': 'All documents are verified by our team before approval',
    'Avaliações Autênticas': 'Authentic Reviews',
    'Sistema anti-fraude que garante feedback genuíno e transparente': 'Anti-fraud system that ensures genuine and transparent feedback',
    'Suporte 24/7': '24/7 Support',
    'Equipa sempre disponível via WhatsApp, email ou telefone': 'Team always available via WhatsApp, email or phone',
    '100% Gratuito': '100% Free',
    'Sem taxas escondidas para clientes. Simples, directo e transparente': 'No hidden fees for clients. Simple, direct and transparent',

    /* ── INDEX: CTA ── */
    'Pronto para Começar?': 'Ready to Get Started?',
    'Junta-te a milhares de angolanos que já encontraram os melhores profissionais': 'Join thousands of Angolans who have already found the best professionals',

    /* ── INDEX: CHOICE MODAL ── */
    'Bem-vindo ao Conecta Já!': 'Welcome to Conecta Já!',
    'Como deseja usar a plataforma?': 'How would you like to use the platform?',
    'Sou Cliente': "I'm a Client",
    'Procuro profissionais para contratar serviços': "I'm looking for professionals to hire",
    'Sou Prestador de Serviços': "I'm a Service Provider",
    'Quero oferecer os meus serviços na plataforma': 'I want to offer my services on the platform',

    /* ── INDEX: PROVIDER PROMO ── */
    'Torna-te um Prestador Conecta Já!': 'Become a Conecta Já Provider!',
    'Como Funciona:': 'How It Works:',
    'Entre em Contacto:': 'Get in Touch:',
    'Respondemos em até 24 horas': 'We respond within 24 hours',
    'WhatsApp': 'WhatsApp',
    'Telefone': 'Phone',

    /* ── PRESTADORES PAGE ── */
    'Encontra o Profissional Certo': 'Find the Right Professional',
    'Escolhe entre centenas de prestadores verificados': 'Choose from hundreds of verified providers',
    'Que serviço precisas?': 'What service do you need?',
    'Todas as cidades': 'All cities',
    'Todas as categorias': 'All categories',
    'Todos': 'All',
    'Ordenar por': 'Sort by',
    'Melhor avaliação': 'Best rating',
    'Mais recentes': 'Most recent',
    'Mais pedidos': 'Most requested',
    'prestadores encontrados': 'providers found',
    'És prestador?': 'Are you a provider?',
    'Regista-te gratuitamente e começa a receber clientes hoje.': 'Register for free and start receiving clients today.',

    /* ── SEARCH FORM ── */
    'Todas as Províncias': 'All Provinces',
    'Todas as Categorias': 'All Categories',
    'Ex: Canalizador, Professor de Inglês, Pintor...': 'E.g.: Plumber, English Teacher, Painter...',

    /* ── SOBRE PAGE ── */
    'Quem Somos': 'Who We Are',
    'Sobre o Conecta Já': 'About Conecta Já',
    'Conectando pessoas aos melhores profissionais de Angola desde 2026': "Connecting people to Angola's best professionals since 2026",
    'Nossa História': 'Our Story',
    'Como Tudo Começou': 'How It All Started',
    'Missão, Visão e Valores': 'Mission, Vision and Values',
    'Os pilares que guiam cada decisão que tomamos': 'The pillars that guide every decision we make',
    'Missão': 'Mission',
    'Conectar clientes a profissionais de forma simples, rápida e confiável': 'Connecting clients to professionals in a simple, fast and reliable way',
    'Conectar clientes a profissionais de forma simples, rápida e confiável, promovendo oportunidades e facilitando a vida das pessoas em Angola.': "Connecting clients to professionals in a simple, fast and reliable way, promoting opportunities and improving people's lives in Angola.",
    'Visão': 'Vision',
    'Ser referência em Angola como a principal plataforma digital de serviços': "To be Angola's leading digital services platform",
    'Ser referência em Angola como a principal plataforma digital de serviços, expandindo futuramente para outros países africanos.': "To be Angola's leading digital services platform, expanding in the future to other African countries.",
    'Valores': 'Values',
    'Confiança': 'Trust',
    'Transparência': 'Transparency',
    'Qualidade': 'Quality',
    'Inovação': 'Innovation',
    'Compromisso': 'Commitment',
    'Prestadores Ativos': 'Active Providers',
    'Colaboradores': 'Team Members',
    'Nossa Equipa': 'Our Team',
    'Conheça Nossa Liderança': 'Meet Our Leadership',
    'Profissionais dedicados a construir a melhor plataforma de serviços de Angola': "Professionals dedicated to building Angola's best services platform",
    'CEO, Fundador & Lead Developer': 'CEO, Founder & Lead Developer',
    'Co-Fundadora': 'Co-Founder',
    'Conquistas': 'Milestones',
    'Nossos Marcos Importantes': 'Our Key Milestones',
    'Lançamento Oficial': 'Official Launch',
    'Lançamento oficial da plataforma Conecta Já em Luanda': 'Official launch of the Conecta Já platform in Luanda',
    'Parcerias Estratégicas': 'Strategic Partnerships',
    'Crescimento Contínuo': 'Continuous Growth',
    'Crescimento exponencial da comunidade': 'Exponential community growth',
    'Parcerias': 'Partnerships',
    'Os Nossos Parceiros': 'Our Partners',
    'Trabalhamos com as melhores marcas para oferecer o melhor serviço': 'We work with the best brands to offer the best service',

    /* ── FAQ PAGE ── */
    'Ajuda & Suporte': 'Help & Support',
    'Perguntas Frequentes': 'Frequently Asked Questions',
    'Encontra respostas rápidas às tuas dúvidas sobre o Conecta Já': 'Find quick answers to your questions about Conecta Já',
    'Pesquisar nas perguntas…': 'Search questions…',
    'Geral': 'General',
    'Clientes': 'Clients',
    'Pagamentos': 'Payments',
    'O que é o Conecta Já?': 'What is Conecta Já?',
    'O Conecta Já é gratuito?': 'Is Conecta Já free?',
    'Como garantem a qualidade dos prestadores?': 'How do you ensure provider quality?',
    'Em que cidades o serviço está disponível?': 'Which cities is the service available in?',
    'Como posso contactar o suporte?': 'How can I contact support?',
    'Como faço para contratar um prestador?': 'How do I hire a provider?',
    'Preciso de criar uma conta para usar a plataforma?': 'Do I need an account to use the platform?',
    'Como funciona o sistema de avaliações?': 'How does the rating system work?',
    'O que faço se o prestador não aparecer?': "What do I do if the provider doesn't show up?",
    'Posso cancelar um pedido?': 'Can I cancel a request?',
    'Como me registo como prestador?': 'How do I register as a provider?',
    'Quanto custa estar na plataforma?': 'How much does it cost to be on the platform?',
    'Como funciona o processo de verificação?': 'How does the verification process work?',
    'Como recebo os pagamentos?': 'How do I receive payments?',
    'Posso oferecer múltiplas categorias de serviço?': 'Can I offer multiple service categories?',
    'O Conecta Já processa pagamentos?': 'Does Conecta Já process payments?',
    'Quais formas de pagamento os prestadores aceitam?': 'What payment methods do providers accept?',
    'É seguro fazer pagamento antecipado?': 'Is it safe to make upfront payments?',
    'O que faço em caso de disputa de pagamento?': 'What do I do in a payment dispute?',
    'Haverá pagamentos integrados na plataforma?': 'Will there be integrated payments on the platform?',
    'Ainda não encontrei resposta': "I still haven't found an answer",
    'A nossa equipa está disponível via WhatsApp ou email para te ajudar.': 'Our team is available via WhatsApp or email to help you.',
    'Contactar Suporte': 'Contact Support',

    /* ── CONTACTO PAGE ── */
    'Entre em Contacto': 'Get in Touch',
    'Fala Connosco': 'Talk to Us',
    'A nossa equipa está disponível para responder a qualquer questão.': 'Our team is available to answer any questions.',
    'Sempre aqui para ti': 'Always here for you',
    'Tens uma dúvida, sugestão ou precisas de ajuda? Estamos cá para ti, sempre.': 'Have a question, suggestion, or need help? We\'re here for you, always.',
    'Horário de Atendimento': 'Business Hours',
    'Segunda — Sexta': 'Monday — Friday',
    'Sábado': 'Saturday',
    'Domingo': 'Sunday',
    'Fechado': 'Closed',
    'Envia-nos uma Mensagem': 'Send Us a Message',
    'Preenche o formulário e respondemos o mais rápido possível.': "Fill out the form and we'll get back to you as soon as possible.",
    'Nome': 'Name',
    'Email': 'Email',
    'Assunto': 'Subject',
    'Seleciona o assunto': 'Select subject',
    'Suporte Técnico': 'Technical Support',
    'Registo como Prestador': 'Provider Registration',
    'Reclamação': 'Complaint',
    'Parceria Comercial': 'Business Partnership',
    'Imprensa': 'Press',
    'Mensagem': 'Message',
    'Mensagem Enviada!': 'Message Sent!',
    'Obrigado por entrar em contacto. Responderemos o mais breve possível.': 'Thank you for getting in touch. We will respond as soon as possible.',
    'Luanda, Angola': 'Luanda, Angola',
    'Baseados em Luanda, servindo todo o país': 'Based in Luanda, serving the whole country',

    /* ── BLOG PAGE ── */
    'Blog & Recursos': 'Blog & Resources',
    'Dicas, Guias & Novidades': 'Tips, Guides & News',
    'Tudo o que precisas de saber sobre serviços em Angola': 'Everything you need to know about services in Angola',
    'Tudo o que precisas de saber sobre serviços em Angola — para clientes e prestadores.': 'Everything you need to know about services in Angola — for clients and providers.',
    'Central de Ajuda': 'Help Centre',
    /* prestadores count — <strong> splits it into text nodes */
    'A mostrar': 'Showing',
    ' os prestadores': ' providers',
    'todos': 'all',
    'Destaque': 'Featured',
    'Equipa Conecta Já': 'Conecta Já Team',
    'Maio 2026': 'May 2026',
    'Ler Artigo': 'Read Article',
    'Todos': 'All',
    'Dicas': 'Tips',
    'Negócios': 'Business',
    'Angola': 'Angola',
    'Pesquisar artigos…': 'Search articles…',
    '5 perguntas que deves fazer antes de contratar qualquer prestador': '5 questions to ask before hiring any provider',
    'Evita surpresas desagradáveis com estas perguntas essenciais que todo cliente deve fazer antes de contratar um serviço.': 'Avoid unpleasant surprises with these essential questions every client should ask before hiring.',
    'Como criar um perfil perfeito no Conecta Já e atrair mais clientes': 'How to create a perfect Conecta Já profile and attract more clients',
    'Um bom perfil é a tua montra digital. Aprende como escrever a tua bio, definir preços e destacar os teus pontos fortes.': 'A good profile is your digital showcase. Learn how to write your bio, set prices and highlight your strengths.',
    'Como definir o preço justo pelos teus serviços em Angola': 'How to set a fair price for your services in Angola',
    'Cobrar de menos desvaloriza o teu trabalho. Cobrar de mais afasta clientes. Aprende a encontrar o equilíbrio certo.': 'Charging too little devalues your work. Charging too much pushes clients away. Learn to find the right balance.',
    'Mercado de serviços em Angola: oportunidades e desafios em 2026': "Angola's services market: opportunities and challenges in 2026",
    'Uma análise completa do mercado de prestação de serviços em Angola, as tendências que estão a moldar o setor e onde estão as maiores oportunidades.': "A comprehensive analysis of Angola's services market, the trends shaping the sector, and where the biggest opportunities lie.",
    'O futuro dos serviços digitais em Angola: o que esperar nos próximos anos': 'The future of digital services in Angola: what to expect in the coming years',
    'Digitalização, pagamentos móveis e plataformas como o Conecta Já estão a transformar a forma como os angolanos acedem a serviços.': 'Digitalization, mobile payments and platforms like Conecta Já are transforming how Angolans access services.',
    'Segurança em primeiro lugar: como evitar fraudes ao contratar serviços': 'Safety first: how to avoid fraud when hiring services',
    'Sinais de alerta que deves identificar antes de efetuar qualquer pagamento. Protege-te com estas dicas práticas e comprovadas.': 'Warning signs to identify before making any payment. Protect yourself with these practical, proven tips.',
    'Avaliações 5 estrelas: o segredo dos melhores prestadores do Conecta Já': "5-star reviews: the secret of Conecta Já's top providers",
    'O que os prestadores com melhor avaliação têm em comum? Entrevistámos os top-rated e descobrimos os seus segredos.': 'What do the highest-rated providers have in common? We interviewed the top-rated ones and discovered their secrets.',
    'Da informalidade ao sucesso: histórias de prestadores que transformaram a sua carreira': 'From informal to success: stories of providers who transformed their careers',
    'Conhece a história de 3 profissionais angolanos que usaram plataformas digitais para formalizar e expandir o seu negócio.': 'Meet the story of 3 Angolan professionals who used digital platforms to formalize and expand their business.',
    'Conecta Já: como a plataforma está a mudar o acesso a serviços em Luanda': 'Conecta Já: how the platform is changing access to services in Luanda',
    'Um olhar sobre o impacto real da plataforma na vida de clientes e prestadores de Luanda nos primeiros meses de operação.': 'A look at the real impact of the platform on the lives of clients and providers in Luanda in its first months of operation.',
    '5 min': '5 min',
    '7 min': '7 min',
    '6 min': '6 min',
    '10 min': '10 min',
    '8 min': '8 min',
    '4 min': '4 min',
    '9 min': '9 min',
    'Como contratar um prestador de serviços seguro em Angola: o guia completo': 'How to hire a safe service provider in Angola: the complete guide',
    'Aprende tudo sobre como verificar credenciais, comparar preços, negociar e garantir que o serviço é entregue com qualidade. Este guia vai mudar a forma como contratas profissionais.': 'Learn everything about verifying credentials, comparing prices, negotiating, and ensuring quality service delivery. This guide will change how you hire professionals.',
    '8 min leitura': '8 min read',

    /* ── SEGURANÇA PAGE ── */
    'A tua Segurança em Primeiro': 'Your Safety Comes First',
    'Como protegemos os teus dados e garantimos transações seguras': 'How we protect your data and ensure secure transactions',
    'Sistema de Avaliações': 'Review System',
    'As avaliações reais de clientes verificados ajudam-te a escolher o prestador certo.': 'Real reviews from verified clients help you choose the right provider.',
    'Dados Encriptados': 'Encrypted Data',
    'Todos os dados pessoais são armazenados com encriptação de nível bancário.': 'All personal data is stored with bank-level encryption.',
    'Sistema de Reportes': 'Report System',
    'Podes reportar comportamentos suspeitos ou inadequados diretamente na plataforma.': 'You can report suspicious or inappropriate behavior directly on the platform.',
    'Monitorização Contínua': 'Continuous Monitoring',
    'A plataforma é monitorizada continuamente para detetar atividades fraudulentas.': 'The platform is continuously monitored to detect fraudulent activities.',
    'Dicas de Segurança': 'Safety Tips',
    'Como te manter seguro': 'How to stay safe',
    'Segue estas dicas para ter uma experiência segura na plataforma': 'Follow these tips for a safe experience on the platform',
    'Verifica o perfil antes de contratar': 'Verify the profile before hiring',
    'Evita pagamentos antecipados totais': 'Avoid full upfront payments',
    'Documenta o acordo': 'Document the agreement',
    'Não partilhes dados sensíveis': "Don't share sensitive data",
    'Reporta comportamentos suspeitos': 'Report suspicious behavior',
    'Prefere prestadores verificados': 'Prefer verified providers',
    'Encontraste algo suspeito?': 'Found something suspicious?',
    'A segurança da nossa comunidade depende de todos': "Our community's safety depends on everyone",

    /* ── PRIVACIDADE PAGE ── */
    'Política de Privacidade': 'Privacy Policy',
    'Como recolhemos, utilizamos e protegemos os teus dados pessoais': 'How we collect, use and protect your personal data',
    'Índice': 'Contents',
    'Dados Recolhidos': 'Data Collected',
    'Utilização': 'Usage',
    'Partilha': 'Sharing',
    'Os teus Direitos': 'Your Rights',
    'Retenção': 'Retention',
    'Menores': 'Minors',
    'Alterações': 'Changes',
    'Última atualização: Maio de 2026': 'Last updated: May 2026',
    'Proteção de dados garantida': 'Data protection guaranteed',
    'A tua privacidade é importante para nós.': 'Your privacy is important to us.',
    'Dados que Recolhemos': 'Data We Collect',
    'Como Utilizamos os teus Dados': 'How We Use Your Data',
    'Partilha de Dados': 'Data Sharing',
    'Segurança dos Dados': 'Data Security',
    'Acesso': 'Access',
    'Retificação': 'Rectification',
    'Eliminação': 'Deletion',
    'Oposição': 'Opposition',
    'Portabilidade': 'Portability',
    'Limitação': 'Limitation',
    'Retenção de Dados': 'Data Retention',
    'Menores de Idade': 'Minors',
    'Alterações a esta Política': 'Changes to this Policy',

    /* ── TERMOS PAGE ── */
    'Legal': 'Legal',
    'Termos de Uso': 'Terms of Use',
    'As regras que regem a utilização da plataforma Conecta Já': 'The rules governing the use of the Conecta Já platform',
    'Aceitação': 'Acceptance',
    'Descrição dos Serviços': 'Description of Services',
    'Conta de Utilizador': 'User Account',
    'Conduta': 'Conduct',
    'Responsabilidade': 'Liability',
    'Propriedade Intelectual': 'Intellectual Property',
    'Rescisão': 'Termination',
    'Aplicável em Angola': 'Applicable in Angola',
    'Por favor lê estes termos com atenção.': 'Please read these terms carefully.',
    'Aceitação dos Termos': 'Acceptance of Terms',
    'Prestadores de Serviços': 'Service Providers',
    'Conduta Proibida': 'Prohibited Conduct',
    'Limitação de Responsabilidade': 'Limitation of Liability',
    'Alterações aos Termos': 'Changes to Terms',

    /* ── DASHBOARD CLIENT ── */
    'Visão Geral': 'Overview',
    'Os meus Pedidos': 'My Requests',
    'Notificações': 'Notifications',
    'Editar Perfil': 'Edit Profile',
    'Encontrar Prestadores': 'Find Providers',
    'Bem-vindo!': 'Welcome!',
    'Gere os teus pedidos e encontra os melhores prestadores em Angola.': 'Manage your requests and find the best providers in Angola.',
    'Total de Pedidos': 'Total Requests',
    'Concluídos': 'Completed',
    'Pendentes': 'Pending',
    'A carregar pedidos…': 'Loading requests…',
    'Sem notificações': 'No notifications',
    'Início': 'Home',
    'Pedidos': 'Requests',
    'Avisos': 'Alerts',
    'Perfil': 'Profile',

    /* ── DASHBOARD PROVIDER ── */
    'Pedidos Recebidos': 'Received Requests',
    'Avaliações': 'Reviews',
    'Painel do Prestador': 'Provider Dashboard',
    'Gere os teus pedidos, avaliações e o teu perfil no Conecta Já.': 'Manage your requests, reviews and profile on Conecta Já.',
    'Total Pedidos': 'Total Requests',
    'O meu Perfil': 'My Profile',
    'Classificação': 'Rating',
    'Dicas de Sucesso': 'Success Tips',
    'Adiciona fotos ao perfil': 'Add photos to profile',
    'Perfis com fotos recebem 3x mais contactos.': 'Profiles with photos get 3× more contacts.',
    'Responde rapidamente': 'Respond quickly',
    'Responder em menos de 1h aumenta as conversões.': 'Responding in under 1 hour increases conversions.',
    'Pede avaliações': 'Ask for reviews',
    'Após cada serviço, pede ao cliente uma avaliação.': 'After each service, ask the client for a review.',
    'Em tempo real': 'Real-time',

    /* ── PERFIL / MEU-PERFIL ── */
    'Meu Perfil': 'My Profile',
    'A carregar…': 'Loading…',
    'Explorar Prestadores': 'Explore Providers',
    'Alterar foto': 'Change photo',
    'Bio / Descrição': 'Bio / Description',
    'Fala sobre os teus serviços, experiência e o que te destaca…': 'Tell us about your services, experience and what sets you apart…',
    'Serviços Oferecidos': 'Services Offered',
    'Ex: Canalizador, Pintor, Designer…': 'E.g.: Plumber, Painter, Designer…',
    'Disponibilidade': 'Availability',
    'Preço Base (AOA)': 'Base Price (AOA)',
    'Ex: 5000': 'E.g.: 5000',
    'Localização': 'Location',
    'Ex: Luanda': 'E.g.: Luanda',
    'Guardar Alterações': 'Save Changes',

    /* ── AUTH MODAL ── */
    'Entrar na tua conta': 'Sign in to your account',
    'Criar conta gratuita': 'Create free account',
    'Ou continua com': 'Or continue with',
    'Google': 'Google',
    'Esqueci a senha': 'Forgot password',
    'Voltar ao login': 'Back to login',
    'Recuperar Senha': 'Recover Password',
    'Enviar link de recuperação': 'Send recovery link',

    /* ── QUICK ACTIONS (dashboard) ── */
    'Pesquisar': 'Search',

    /* ── OFFLINE PAGE ── */
    'Sem Ligação': 'No Connection',
    'Parece que estás offline.': 'It looks like you are offline.',
    'Verificar Ligação': 'Check Connection',
    'Ir para o Início': 'Go to Home',

    /* ── SECTION BADGES (labels) ── */
    'Processo': 'Process',
    'Testemunhos': 'Testimonials',
    'Parceiros': 'Partners',
    'Confiança': 'Trust',
    'Conquistas': 'Milestones',
    'Equipa': 'Team',

    /* ── SPAN-SPLIT HEADINGS (text nodes separated by <span>) ── */
    'Conecta-te aos': 'Connect to the',
    'Explora por': 'Explore by',
    'Funciona?': 'Does It Work?',
    'Por que Confiar no': 'Why Trust',
    'O que dizem os': 'What Our',
    'nossos clientes': 'Clients Say',
    'de Serviços em': 'of Services in',
    'Dicas, Guias &': 'Tips, Guides &',
    'Novidades': 'News',
    /* contacto.html: <h1>Fala <span>Connosco</span></h1> */
    'Fala': 'Talk',
    'Connosco': 'to Us',
    /* faq.html: <h1>Perguntas <span>Frequentes</span></h1> */
    'Perguntas': 'Frequently Asked',
    'Frequentes': 'Questions',
    /* sobre.html: <h1>Sobre o <span>Conecta Já</span></h1> */
    'Sobre o': 'About',
    /* seguranca.html: <h1>A tua <span>Segurança</span> em Primeiro</h1> */
    'A tua': 'Your',
    'em Primeiro': 'Comes First',
    /* termos.html: <h1>Termos de <span>Uso</span></h1> */
    'Termos de': 'Terms of',
    'Uso': 'Use',

    /* ── FOOTER DESCRIPTION ── */
    'A plataforma líder em Angola para conectar clientes a prestadores de serviços verificados e de confiança.': 'The leading platform in Angola connecting clients to verified and trusted service providers.',
    'Beleza': 'Beauty',

    /* ── INDEX: MULTI-LINE STEP DESCRIPTIONS (whitespace-normalized) ── */
    'Usa a nossa busca avançada para encontrar o prestador ideal. Filtra por categoria, localização, avaliações e preço.': 'Use our advanced search to find the ideal provider. Filter by category, location, reviews and price.',
    'Contacta directamente com o prestador via WhatsApp ou telefone. Recebe orçamentos e agenda o serviço de forma transparente.': 'Contact the provider directly via WhatsApp or phone. Receive quotes and schedule the service transparently.',
    'Após a conclusão do trabalho, deixa a tua avaliação honesta. O teu feedback ajuda outros clientes e incentiva a excelência.': 'After the work is done, leave your honest review. Your feedback helps other clients and encourages excellence.',

    /* ── TRUST SECTION MULTI-LINE ── */
    'Somos a plataforma mais segura e confiável de Angola. Todos os nossos prestadores passam por verificação rigorosa antes de serem aprovados.': "We are Angola's safest and most reliable platform. All our providers go through rigorous verification before being approved.",

    /* ── TESTIMONIAL ROLES ── */
    'Cliente · Luanda': 'Client · Luanda',
    'Eletricista · Luanda': 'Electrician · Luanda',
    'Professora · Benguela': 'Teacher · Benguela',
    'Empresário · Luanda': 'Entrepreneur · Luanda',
    'Decoradora · Luanda': 'Decorator · Luanda',

    /* ── INDEX: TESTIMONIALS (full text) ── */
    'Encontrei um canalizador excelente em menos de 10 minutos! O serviço foi impecável e o preço muito justo. Nunca mais vou procurar profissionais de outra forma.': 'I found an excellent plumber in less than 10 minutes! The service was impeccable and the price very fair. I will never look for professionals any other way.',
    'Desde que me registei como prestador, o meu negócio cresceu exponencialmente. Recebo pedidos diariamente e a plataforma é muito fácil de usar.': 'Since I registered as a provider, my business has grown exponentially. I receive requests daily and the platform is very easy to use.',
    'Precisava urgentemente de um professor de matemática para o meu filho. Em 30 minutos tinha encontrado um profissional incrível com ótimas avaliações!': 'I urgently needed a maths teacher for my son. In 30 minutes I had found an incredible professional with great reviews!',
    'A verificação dos prestadores dá-me muita confiança. Já contratei 5 profissionais diferentes e nunca tive problemas. Recomendo a todos!': 'The provider verification gives me a lot of confidence. I have already hired 5 different professionals and never had problems. I recommend it to everyone!',
    'Como decoradora de eventos, o Conecta Já transformou o meu negócio. A visibilidade que a plataforma me deu foi incrível!': 'As an event decorator, Conecta Já transformed my business. The visibility the platform gave me was incredible!',

    /* ── INDEX: PROVIDER PROMO STEPS ── */
    'Entra em contacto connosco através de um dos canais abaixo': 'Get in touch with us through one of the channels below',
    'Envia-nos as tuas informações profissionais com fotos e vídeos dos serviços realizados': 'Send us your professional information with photos and videos of work done',
    'A nossa equipa irá validar o teu perfil (24-48h)': 'Our team will validate your profile (24–48h)',
    'Após aprovação, a tua sessão será criada e começas a receber pedidos!': 'After approval, your account will be created and you will start receiving requests!',
    'Ótimo! Para começar a oferecer os teus serviços na nossa plataforma, precisamos validar o teu perfil e garantir a qualidade dos nossos prestadores.': 'Great! To start offering your services on our platform, we need to validate your profile and ensure the quality of our providers.',
    'Entra em Contacto:': 'Get in Touch:',
    'Como Funciona:': 'How It Works:',
    'Respondemos em até 24 horas': 'We respond within 24 hours',

    /* ── INDEX: PROVIDER COUNT BADGES ── */
    '150+ disponíveis': '150+ available',
    '200+ disponíveis': '200+ available',
    '300+ disponíveis': '300+ available',
    '120+ disponíveis': '120+ available',

    /* ── PRESTADORES: FILTERS ── */
    'Apenas disponíveis': 'Available only',
    'Apenas verificados': 'Verified only',
    'Vista em grelha': 'Grid view',
    'Vista em lista': 'List view',

    /* ── SOBRE: STORY ── */
    'A Conecta Já foi fundada em': 'Conecta Já was founded in',
    '2026, em Luanda': '2026, in Luanda',
    ', por jovens empreendedores angolanos com o objetivo de facilitar o acesso a serviços no dia a dia. A plataforma surgiu para resolver a dificuldade de encontrar profissionais confiáveis de forma rápida e segura.': ', by young Angolan entrepreneurs with the goal of making everyday service access easier. The platform emerged to solve the difficulty of finding reliable professionals quickly and safely.',
    'A Conecta Já foi fundada em 2026, em Luanda, por jovens empreendedores angolanos com o objetivo de facilitar o acesso a serviços no dia a dia. A plataforma surgiu para resolver a dificuldade de encontrar profissionais confiáveis de forma rápida e segura.': 'Conecta Já was founded in 2026 in Luanda by young Angolan entrepreneurs with the goal of making everyday service access easier. The platform emerged to solve the difficulty of finding reliable professionals quickly and safely.',
    'Percebemos que muitas pessoas enfrentavam desafios ao tentar encontrar prestadores de serviços de qualidade — desde canalizadores a professores particulares. Decidimos criar uma solução que conectasse clientes e profissionais de maneira transparente, eficiente e confiável.': 'We noticed that many people faced challenges when trying to find quality service providers — from plumbers to private tutors. We decided to create a solution that would connect clients and professionals in a transparent, efficient and reliable way.',
    'Hoje, a Conecta Já é a melhor e unica plataforma em Angola para contratar serviços, com prestadores verificados em todas as províncias.': 'Today, Conecta Já is the best and only platform in Angola for hiring services, with verified providers in every province.',
    'Conectando pessoas aos melhores profissionais de Angola desde 2026, com tecnologia, confiança e propósito.': "Connecting people to Angola's best professionals since 2026, with technology, trust and purpose.",
    'Junta-te a milhares de angolanos que já encontraram os melhores profissionais através do Conecta Já.': 'Join thousands of Angolans who have already found the best professionals through Conecta Já.',
    'Falar Connosco': 'Talk to Us',

    /* ── SOBRE: TEAM BIOS ── */
    'Visionário por trás do Conecta Já, responsável pela criação e desenvolvimento completo da plataforma. Lidera a estratégia do negócio, inovação e crescimento da empresa em Angola, garantindo uma experiência eficiente, segura e moderna para clientes e prestadores de serviços.': 'The visionary behind Conecta Já, responsible for the complete creation and development of the platform. He leads business strategy, innovation and company growth in Angola, ensuring an efficient, secure and modern experience for clients and service providers.',
    'Pelo suporte incondicional — emocional e financeiro — que tornou possível o início deste projeto. Seu incentivo foi determinante para transformar uma ideia em realidade e o seu espírito empresarial é a maior inspiração do Conecta Já.': 'For the unconditional support — emotional and financial — that made the start of this project possible. Her encouragement was decisive in turning an idea into reality and her entrepreneurial spirit is Conecta Já\'s greatest inspiration.',

    /* ── SOBRE: TIMELINE ── */
    'Lançamento oficial da plataforma Conecta Já em Luanda, marcando o início da nossa jornada de conectar Angola.': 'Official launch of the Conecta Já platform in Luanda, marking the beginning of our journey to connect Angola.',
    'Estabelecemos parcerias com a ET12AT, Djeyone, SevenFragance e RicartesDigital, fortalecendo a nossa presença no mercado angolano.': 'We established partnerships with ET12AT, Djeyone, SevenFragance and RicartesDigital, strengthening our presence in the Angolan market.',
    'Crescimento exponencial da comunidade de utilizadores e prestadores, consolidando a nossa posição como plataforma líder em Angola.': 'Exponential growth of the user and provider community, consolidating our position as the leading platform in Angola.',

    /* ── SOBRE: PARTNERS ── */
    'Equipe de realização da Conecta Já': 'Conecta Já Production Team',
    'Cosmética & Beleza': 'Cosmetics & Beauty',
    'Marketing Digital': 'Digital Marketing',
    'Perfumaria': 'Perfumery',

    /* ── FAQ: ANSWERS ── */
    'O Conecta Já é a plataforma digital angolana que liga clientes a prestadores de serviços verificados e de confiança. Desde canalizadores a designers, encontras o profissional certo de forma rápida, segura e sem complicações.': 'Conecta Já is the Angolan digital platform that connects clients to verified and trusted service providers. From plumbers to designers, you find the right professional quickly, safely and without complications.',
    'Para clientes, a utilização da plataforma é totalmente gratuita. Podes pesquisar, contactar e contratar prestadores sem qualquer custo. Os prestadores de serviços têm planos de subscrição para aumentar a sua visibilidade na plataforma.': 'For clients, using the platform is completely free. You can search, contact and hire providers at no cost. Service providers have subscription plans to increase their visibility on the platform.',
    'Todos os prestadores passam por um processo de verificação de identidade e histórico profissional. Além disso, o sistema de avaliações permite que os clientes deixem feedback real sobre os serviços recebidos, garantindo transparência e qualidade contínua.': 'All providers go through an identity and professional background verification process. In addition, the review system allows clients to leave real feedback on services received, ensuring ongoing transparency and quality.',
    'Atualmente o Conecta Já opera em Luanda, Benguela, Lubango, Huambo, Cabinda e Malanje. Estamos a expandir rapidamente para cobrir todo o território nacional em 2026.': 'Conecta Já currently operates in Luanda, Benguela, Lubango, Huambo, Cabinda and Malanje. We are expanding rapidly to cover the entire national territory in 2026.',
    'Podes contactar-nos através do formulário de contacto, por WhatsApp no +244 931 482 577, ou por email em conectaja.ao@gmail.com. Respondemos em até 24 horas em dias úteis.': 'You can contact us via the contact form, by WhatsApp at +244 931 482 577, or by email at conectaja.ao@gmail.com. We respond within 24 hours on business days.',
    'É simples: pesquisa o serviço que precisas, filtra por localização e categoria, escolhe o prestador que mais te agrada, e contacta diretamente via WhatsApp ou pelo botão "Fazer Pedido" no perfil. O processo é rápido e sem intermediários desnecessários.': 'It\'s simple: search for the service you need, filter by location and category, choose the provider you like most, and contact them directly via WhatsApp or by the "Make a Request" button on the profile. The process is fast and without unnecessary middlemen.',
    'Podes pesquisar e ver perfis sem conta. No entanto, para fazer pedidos, deixar avaliações e aceder ao dashboard pessoal, precisas de criar uma conta gratuita. O registo demora menos de 2 minutos.': 'You can search and view profiles without an account. However, to make requests, leave reviews and access the personal dashboard, you need to create a free account. Registration takes less than 2 minutes.',
    'Após a conclusão de um serviço, podes deixar uma avaliação de 1 a 5 estrelas e um comentário sobre a tua experiência. As avaliações são públicas e ajudam outros clientes a escolher o prestador certo. Pedimos honestidade e respeito nas avaliações.': 'After a service is completed, you can leave a 1 to 5 star review and a comment about your experience. Reviews are public and help other clients choose the right provider. We ask for honesty and respect in reviews.',
    'Se um prestador não comparecer ou não cumprir o acordado, contacta-nos imediatamente. Teremos todo o gosto em ajudar a resolver a situação e, se necessário, recomendar-te outro profissional disponível. A tua satisfação é a nossa prioridade.': "If a provider doesn't show up or doesn't fulfil the agreement, contact us immediately. We will be happy to help resolve the situation and, if necessary, recommend another available professional. Your satisfaction is our priority.",
    'Sim, podes cancelar um pedido a qualquer momento antes do serviço ser iniciado. Acede ao teu dashboard, localiza o pedido e clica em "Cancelar". Recomendamos que informes o prestador com a maior antecedência possível.': 'Yes, you can cancel a request at any time before the service starts. Go to your dashboard, find the request and click "Cancel". We recommend letting the provider know as early as possible.',
    'Clica em "Oferecer Serviços" na página inicial, preenche o formulário de registo como prestador, indica a tua especialidade, localização e preços. Após verificação da nossa equipa (em até 48h), o teu perfil fica ativo e visível para clientes.': 'Click "Offer Services" on the home page, fill in the provider registration form, indicate your speciality, location and prices. After our team\'s verification (within 48h), your profile becomes active and visible to clients.',
    'O plano básico é gratuito e inclui um perfil público, receber pedidos e avaliações. Os planos premium oferecem maior visibilidade nos resultados de pesquisa, destaque no topo das categorias e acesso a estatísticas avançadas. Consulta os nossos planos em contacto.': 'The basic plan is free and includes a public profile, receiving requests and reviews. Premium plans offer greater visibility in search results, top-of-category placement and access to advanced statistics. Check our plans in contact.',
    'A nossa equipa verifica a identidade do prestador (BI/Passaporte) e valida as qualificações declaradas. Prestadores verificados recebem um selo de verificação no perfil, o que aumenta significativamente a confiança dos clientes e as contratações.': 'Our team verifies the provider\'s identity (ID/Passport) and validates declared qualifications. Verified providers receive a verification badge on their profile, which significantly increases client trust and bookings.',
    'O pagamento é combinado diretamente entre o cliente e o prestador, de acordo com o que foi acordado. O Conecta Já facilita a descoberta e o contacto, mas não interfere nos acordos financeiros. Podes aceitar dinheiro, transferência bancária ou multicaixa.': 'Payment is arranged directly between the client and the provider, according to what was agreed. Conecta Já facilitates discovery and contact, but does not interfere in financial agreements. You can accept cash, bank transfer or multicaixa.',
    'Sim! Podes indicar mais do que uma especialidade no teu perfil. No entanto, recomendamos focar nas tuas competências principais para garantir avaliações excelentes e construir uma reputação sólida na plataforma.': 'Yes! You can list more than one speciality on your profile. However, we recommend focusing on your core skills to ensure excellent reviews and build a solid reputation on the platform.',
    'Atualmente, o Conecta Já não processa pagamentos diretamente. Funciona como uma plataforma de descoberta e contacto — os pagamentos são acordados e realizados diretamente entre cliente e prestador. Estamos a trabalhar numa solução de pagamentos integrada para breve.': 'Currently, Conecta Já does not process payments directly. It works as a discovery and contact platform — payments are agreed and made directly between client and provider. We are working on an integrated payment solution coming soon.',
    'Cada prestador define as suas formas de pagamento aceites, geralmente: dinheiro em mão, transferência bancária (BFA, BIC, BAI), Multicaixa Express ou pagamento por referência. Podes ver no perfil do prestador ou perguntar diretamente antes de contratar.': 'Each provider defines their accepted payment methods, usually: cash in hand, bank transfer (BFA, BIC, BAI), Multicaixa Express or reference payment. You can see this on the provider\'s profile or ask directly before hiring.',
    'Recomendamos sempre verificar o histórico e avaliações do prestador antes de qualquer pagamento antecipado. Para novos prestadores sem histórico, podes optar por pagar após a conclusão do trabalho. Prestadores com o selo de verificação têm maior nível de confiança.': 'We always recommend checking the provider\'s history and reviews before any upfront payment. For new providers without a history, you can choose to pay after the work is done. Providers with the verification badge have a higher level of trust.',
    'Em caso de disputa, contacta-nos através do formulário de suporte com os detalhes do pedido e do problema. A nossa equipa irá mediar a situação e tentar encontrar uma solução justa para ambas as partes. Documentar sempre o acordo por escrito (WhatsApp, email) ajuda muito nestes casos.': 'In case of a dispute, contact us via the support form with the details of the request and the problem. Our team will mediate the situation and try to find a fair solution for both parties. Always documenting the agreement in writing (WhatsApp, email) helps a lot in these cases.',
    'Sim! Estamos a desenvolver um sistema de pagamentos integrado que permitirá pagamentos seguros direto na plataforma, com proteção para ambas as partes. Esta funcionalidade estará disponível num futuro próximo. Inscreve-te na nossa newsletter para saber quando lançarmos.': 'Yes! We are developing an integrated payment system that will allow secure payments directly on the platform, with protection for both parties. This feature will be available in the near future. Subscribe to our newsletter to know when we launch.',
    'Encontra respostas rápidas às tuas dúvidas sobre o Conecta Já': 'Find quick answers to your questions about Conecta Já',

    /* ── CONTACTO: EXTRA ── */
    'Tens uma dúvida, sugestão ou precisas de ajuda? A equipa Conecta Já está pronta para ouvir e ajudar. Escolhe o canal que preferires.': 'Have a question, suggestion, or need help? The Conecta Já team is ready to listen and help. Choose the channel you prefer.',
    '08:00 — 18:00': '08:00 — 18:00',
    '09:00 — 14:00': '09:00 — 14:00',
    'A nossa equipa está disponível para responder a qualquer questão.': 'Our team is available to answer any questions.',
    'Atendimento 24/7': '24/7 Support',

    /* ── BLOG: NEWSLETTER ── */
    'Fica sempre atualizado': 'Stay always up to date',
    'Recebe as melhores dicas e novidades do Conecta Já diretamente no teu email. Sem spam, prometemos.': 'Receive the best tips and news from Conecta Já directly in your email. No spam, we promise.',
    'Subscrever': 'Subscribe',
    'o.teu@email.com': 'your@email.com',
    'Email para newsletter': 'Newsletter email',

    /* ── SEGURANÇA: CARD DESCRIPTIONS ── */
    'Todos os prestadores passam por um processo de verificação de identidade antes de serem listados. Verificamos BI/Passaporte e credenciais profissionais.': 'All providers go through an identity verification process before being listed. We verify ID/Passport and professional credentials.',
    'As avaliações reais de clientes verificados ajudam-te a escolher os melhores profissionais. Avaliações falsas são detetadas e removidas automaticamente.': 'Real reviews from verified clients help you choose the best professionals. Fake reviews are automatically detected and removed.',
    'Todos os dados pessoais são armazenados com encriptação de nível bancário. As tuas informações nunca são partilhadas com terceiros sem o teu consentimento.': 'All personal data is stored with bank-level encryption. Your information is never shared with third parties without your consent.',
    'A nossa equipa de suporte está disponível para ajudar em situações de disputa ou problemas com prestadores. Respondemos em menos de 24 horas.': 'Our support team is available to help in dispute situations or problems with providers. We respond within 24 hours.',
    'Podes reportar comportamentos suspeitos ou inadequados. Investigamos todos os reportes e tomamos medidas rápidas para proteger a comunidade.': 'You can report suspicious or inappropriate behaviour. We investigate all reports and take swift action to protect the community.',
    'A plataforma é monitorizada continuamente para detetar atividades fraudulentas ou suspeitas. Contas mal-intencionadas são bloqueadas imediatamente.': 'The platform is continuously monitored to detect fraudulent or suspicious activities. Malicious accounts are blocked immediately.',

    /* ── SEGURANÇA: SAFETY TIPS DETAILS ── */
    'Lê as avaliações, verifica o selo de verificado e analisa o histórico do prestador.': 'Read the reviews, check the verified badge and analyse the provider\'s history.',
    'Prefere pagar após a conclusão do serviço, ou parcialmente antes e o restante depois.': 'Prefer to pay after the service is completed, or partially before and the rest after.',
    'Guarda as conversas de WhatsApp e confirma por escrito o serviço, preço e prazo.': 'Save the WhatsApp conversations and confirm the service, price and deadline in writing.',
    'Nunca partilhes senhas, dados bancários ou números de BI fora do processo formal.': 'Never share passwords, bank details or ID numbers outside the formal process.',
    'Se algum prestador ou cliente se comportar de forma suspeita, reporta imediatamente.': 'If any provider or client behaves suspiciously, report it immediately.',
    'Os prestadores com o selo de verificado passaram por uma análise mais rigorosa.': 'Providers with the verified badge have undergone a more rigorous review.',
    'A segurança da nossa comunidade depende de todos. Se identificaste um utilizador suspeito, uma fraude ou qualquer comportamento inadequado, diz-nos imediatamente.': "Our community's safety depends on everyone. If you have identified a suspicious user, fraud or any inappropriate behaviour, tell us immediately.",

    /* ── PRIVACIDADE: SECTIONS ── */
    'Recolhemos apenas os dados necessários para o funcionamento da Plataforma:': 'We only collect data necessary for the Platform to function:',
    /* bullet text nodes (strong splits them) */
    'Dados de registo:': 'Registration data:',
    ' nome, email, número de telefone e tipo de conta': ' name, email, phone number and account type',
    'Dados de registo: nome, email, número de telefone e tipo de conta': 'Registration data: name, email, phone number and account type',
    'Dados de perfil:': 'Profile data:',
    ' foto, bio profissional, localização e categorias de serviço': ' photo, professional bio, location and service categories',
    'Dados de perfil: foto, bio profissional, localização e categorias de serviço': 'Profile data: photo, professional bio, location and service categories',
    'Dados de utilização:': 'Usage data:',
    ' pedidos de serviço, avaliações e mensagens': ' service requests, reviews and messages',
    'Dados de utilização: pedidos de serviço, avaliações e mensagens': 'Usage data: service requests, reviews and messages',
    'Dados técnicos:': 'Technical data:',
    ' endereço IP, tipo de dispositivo e dados de navegação': ' IP address, device type and browsing data',
    'Dados técnicos: endereço IP, tipo de dispositivo e dados de navegação': 'Technical data: IP address, device type and browsing data',
    'Os teus dados são utilizados para:': 'Your data is used to:',
    'Fornecer e melhorar os serviços da Plataforma': 'Provide and improve Platform services',
    'Verificar identidades e autenticar utilizadores': 'Verify identities and authenticate users',
    'Facilitar a comunicação entre clientes e prestadores': 'Facilitate communication between clients and providers',
    'Enviar notificações relevantes sobre a tua conta': 'Send relevant notifications about your account',
    'Cumprir obrigações legais': 'Comply with legal obligations',
    'Analisar e melhorar a experiência de utilização': 'Analyse and improve the user experience',
    'Não vendemos os teus dados a terceiros. Podemos partilhar informações com:': 'We do not sell your data to third parties. We may share information with:',
    'Outros utilizadores:': 'Other users:',
    ' O perfil público dos prestadores é visível a clientes': ' The public profile of providers is visible to clients',
    'Outros utilizadores: O perfil público dos prestadores é visível a clientes': 'Other users: The public profile of providers is visible to clients',
    'Prestadores de serviços técnicos:': 'Technical service providers:',
    ' que nos ajudam a operar a Plataforma': ' who help us operate the Platform',
    'Prestadores de serviços técnicos: que nos ajudam a operar a Plataforma': 'Technical service providers: who help us operate the Platform',
    'Autoridades competentes:': 'Competent authorities:',
    ' quando exigido por lei': ' when required by law',
    'Autoridades competentes: quando exigido por lei': 'Competent authorities: when required by law',
    'Implementamos medidas técnicas e organizacionais para proteger os teus dados, incluindo encriptação de dados sensíveis, controlos de acesso e monitorização de segurança. No entanto, nenhum sistema é 100% seguro.': 'We implement technical and organisational measures to protect your data, including encryption of sensitive data, access controls and security monitoring. However, no system is 100% secure.',
    'Utilizamos cookies e tecnologias similares para melhorar a tua experiência. Podes gerir as preferências de cookies nas definições do teu navegador. Os cookies essenciais são necessários para o funcionamento da Plataforma.': 'We use cookies and similar technologies to improve your experience. You can manage cookie preferences in your browser settings. Essential cookies are necessary for the Platform to function.',
    'Podes solicitar uma cópia dos teus dados pessoais.': 'You can request a copy of your personal data.',
    'Podes corrigir dados incorretos ou incompletos.': 'You can correct incorrect or incomplete data.',
    'Podes pedir a eliminação dos teus dados.': 'You can request the deletion of your data.',
    'Podes opor-te ao processamento dos teus dados.': 'You can object to the processing of your data.',
    'Podes obter os teus dados num formato legível.': 'You can obtain your data in a readable format.',
    'Podes solicitar a limitação do processamento.': 'You can request a limitation of processing.',
    /* link splits these nodes */
    'Para exercer estes direitos, contacta-nos em': 'To exercise these rights, contact us at',
    'Para exercer estes direitos, contacta-nos em conectaja.ao@gmail.com.': 'To exercise these rights, contact us at conectaja.ao@gmail.com.',
    'Conservamos os teus dados enquanto a tua conta estiver ativa ou enquanto necessário para prestar serviços. Após o encerramento da conta, os dados são eliminados em até 90 dias, salvo obrigação legal de conservação mais prolongada.': 'We retain your data while your account is active or as long as necessary to provide services. After account closure, data is deleted within 90 days, unless legally required to be retained longer.',
    'A Plataforma não é destinada a menores de 18 anos. Não recolhemos intencionalmente dados de menores. Se tomarmos conhecimento da recolha de dados de menores, os mesmos serão eliminados imediatamente.': 'The Platform is not intended for minors under 18. We do not intentionally collect data from minors. If we become aware of the collection of data from minors, it will be deleted immediately.',
    'Podemos atualizar esta política periodicamente. Notificaremos os utilizadores sobre alterações significativas por email ou através da Plataforma. A data de última atualização está sempre indicada no topo deste documento.': 'We may update this policy periodically. We will notify users of significant changes by email or through the Platform. The last updated date is always shown at the top of this document.',
    'Para questões sobre privacidade, contacta-nos em': 'For privacy questions, contact us at',
    'Para questões sobre privacidade, contacta-nos em conectaja.ao@gmail.com ou pelo formulário em contacto.html.': 'For privacy questions, contact us at conectaja.ao@gmail.com or via the contact form.',
    ' ou pelo formulário em': ' or via the contact form at',
    ' O Conecta Já compromete-se a proteger os teus dados pessoais e a ser transparente sobre como os utilizamos.': ' Conecta Já is committed to protecting your personal data and being transparent about how we use it.',
    'O Conecta Já compromete-se a proteger os teus dados pessoais e a ser transparente sobre como os utilizamos.': 'Conecta Já is committed to protecting your personal data and being transparent about how we use it.',
    'A tua privacidade é importante para nós.': 'Your privacy is important to us.',

    /* ── TERMOS: SECTIONS ── */
    'Ao acederes e utilizares a plataforma Conecta Já (doravante "Plataforma"), confirmas que leste, compreendeste e concordas em cumprir estes Termos de Uso. Estes termos constituem um acordo legal vinculativo entre ti e a Conecta Já.': 'By accessing and using the Conecta Já platform (hereinafter "Platform"), you confirm that you have read, understood and agree to comply with these Terms of Use. These terms constitute a legally binding agreement between you and Conecta Já.',
    'Se utilizares a Plataforma em nome de uma empresa ou organização, garantis ter autoridade para vincular essa entidade a estes termos.': 'If you use the Platform on behalf of a company or organisation, you warrant that you have the authority to bind that entity to these terms.',
    'O Conecta Já é uma plataforma digital que facilita a ligação entre clientes que procuram serviços e prestadores de serviços em Angola. A Plataforma permite:': 'Conecta Já is a digital platform that facilitates the connection between clients seeking services and service providers in Angola. The Platform allows:',
    'Pesquisar e descobrir prestadores de serviços verificados': 'Search and discover verified service providers',
    'Consultar perfis, avaliações e preços': 'Browse profiles, reviews and prices',
    'Contactar diretamente os prestadores': 'Contact providers directly',
    'Deixar avaliações e feedback': 'Leave reviews and feedback',
    'Gerir pedidos de serviço': 'Manage service requests',
    'O Conecta Já atua como intermediário e não é parte contratante nos acordos celebrados entre clientes e prestadores.': 'Conecta Já acts as an intermediary and is not a contracting party in agreements made between clients and providers.',
    'Para aceder a determinadas funcionalidades, é necessário criar uma conta. Ao registares, comprometeste a:': 'To access certain features, you need to create an account. By registering, you commit to:',
    'Fornecer informações verdadeiras, precisas e atualizadas': 'Providing true, accurate and up-to-date information',
    'Manter a confidencialidade da tua senha': 'Maintaining the confidentiality of your password',
    'Notificar imediatamente o Conecta Já de qualquer uso não autorizado': 'Immediately notifying Conecta Já of any unauthorised use',
    'Ser responsável por todas as atividades realizadas na tua conta': 'Being responsible for all activities carried out on your account',
    'O Conecta Já reserva-se o direito de suspender ou encerrar contas que violem estes termos.': 'Conecta Já reserves the right to suspend or close accounts that violate these terms.',
    'Os prestadores de serviços comprometem-se a:': 'Service providers commit to:',
    'Fornecer informações verídicas sobre as suas qualificações e experiência': 'Providing truthful information about their qualifications and experience',
    'Prestar serviços com qualidade, profissionalismo e dentro dos prazos acordados': 'Providing services with quality, professionalism and within agreed deadlines',
    'Cumprir toda a legislação angolana aplicável': 'Complying with all applicable Angolan legislation',
    'Manter seguros e licenças necessários para a sua atividade': 'Maintaining insurance and licences necessary for their activity',
    'Responder às avaliações de forma respeitosa': 'Responding to reviews in a respectful manner',
    'Os clientes comprometem-se a:': 'Clients commit to:',
    'Fornecer descrições claras e precisas dos serviços pretendidos': 'Providing clear and accurate descriptions of the services required',
    'Cumprir os acordos celebrados com os prestadores': 'Honouring agreements made with providers',
    'Deixar avaliações honestas e respeitosas': 'Leaving honest and respectful reviews',
    'Não utilizar a Plataforma para fins fraudulentos': 'Not using the Platform for fraudulent purposes',
    'É expressamente proibido:': 'It is expressly prohibited to:',
    'Publicar informações falsas, enganosas ou difamatórias': 'Publish false, misleading or defamatory information',
    'Utilizar a Plataforma para atividades ilegais': 'Use the Platform for illegal activities',
    'Tentar aceder a áreas restritas da Plataforma': 'Attempt to access restricted areas of the Platform',
    'Assediar, ameaçar ou intimidar outros utilizadores': 'Harass, threaten or intimidate other users',
    'Criar múltiplas contas com intuito fraudulento': 'Create multiple accounts with fraudulent intent',
    'Copiar, reproduzir ou distribuir conteúdos sem autorização': 'Copy, reproduce or distribute content without authorisation',
    'O Conecta Já não garante a qualidade, segurança ou legalidade dos serviços prestados. A Plataforma não é responsável por:': 'Conecta Já does not guarantee the quality, safety or legality of services provided. The Platform is not responsible for:',
    'Disputas entre clientes e prestadores': 'Disputes between clients and providers',
    'Danos resultantes de serviços prestados': 'Damages resulting from services provided',
    'Perdas financeiras decorrentes de transações entre utilizadores': 'Financial losses arising from transactions between users',
    'Interrupções ou falhas técnicas da Plataforma': 'Platform interruptions or technical failures',
    'Todo o conteúdo da Plataforma, incluindo logótipos, textos, imagens e código, é propriedade exclusiva do Conecta Já e está protegido por direitos de autor. É proibida a reprodução sem autorização prévia e escrita.': 'All Platform content, including logos, texts, images and code, is the exclusive property of Conecta Já and is protected by copyright. Reproduction without prior written authorisation is prohibited.',
    'Podes encerrar a tua conta a qualquer momento através das definições da conta ou contactando-nos. O Conecta Já pode suspender ou encerrar contas por violação destes termos, sem aviso prévio em casos graves.': 'You can close your account at any time through account settings or by contacting us. Conecta Já may suspend or close accounts for violation of these terms, without prior notice in serious cases.',
    'O Conecta Já reserva-se o direito de modificar estes termos a qualquer momento. As alterações serão comunicadas por email ou através da Plataforma. A continuação da utilização após as alterações implica a sua aceitação.': 'Conecta Já reserves the right to modify these terms at any time. Changes will be communicated by email or through the Platform. Continued use after changes implies their acceptance.',
    'Para questões sobre estes termos, contacta-nos em conectaja.ao@gmail.com ou através do formulário de contacto.': 'For questions about these terms, contact us at conectaja.ao@gmail.com or via the contact form.',
    'Por favor lê estes termos com atenção.': 'Please read these terms carefully.',
    ' Ao utilizar a plataforma Conecta Já, concordas com os termos e condições aqui descritos. Se não concordares, deves deixar de utilizar a plataforma.': ' By using the Conecta Já platform, you agree to the terms and conditions described here. If you do not agree, you must stop using the platform.',
    'Por favor lê estes termos com atenção. Ao utilizar a plataforma Conecta Já, concordas com os termos e condições aqui descritos. Se não concordares, deves deixar de utilizar a plataforma.': 'Please read these terms carefully. By using the Conecta Já platform, you agree to the terms and conditions described here. If you do not agree, you must stop using the platform.',
    'Para questões sobre estes termos, contacta-nos em': 'For questions about these terms, contact us at',
    ' ou através do': ' or via the',
    'formulário de contacto': 'contact form',
    'formulário de suporte': 'support form',
    'Para questões sobre estes termos, contacta-nos em conectaja.ao@gmail.com ou através do formulário de contacto.': 'For questions about these terms, contact us at conectaja.ao@gmail.com or via the contact form.',
    /* FAQ link-split nodes */
    'Podes contactar-nos através do': 'You can contact us via the',
    ', por WhatsApp no': ', by WhatsApp at',
    ', ou por email em': ', or by email at',
    '. Respondemos em até 24 horas em dias úteis.': '. We respond within 24 hours on business days.',
    'Consulta os nossos planos em': 'Check our plans at',
    'contacta-nos através do': 'contact us via the',
    ' com os detalhes do pedido e do problema. A nossa equipa irá mediar a situação e tentar encontrar uma solução justa para ambas as partes. Documentar sempre o acordo por escrito (WhatsApp, email) ajuda muito nestes casos.': ' with the details of the request and the problem. Our team will mediate the situation and try to find a fair solution for both parties. Always documenting the agreement in writing (WhatsApp, email) helps a lot in these cases.',

    /* ── MEU-PERFIL: FORM ── */
    'Foto de Perfil (URL ou carrega a imagem acima)': 'Profile Photo (URL or upload the image above)',
    'Nome Completo': 'Full Name',
    'Email (não editável)': 'Email (not editable)',
    'Telefone': 'Phone',
    'Biografia / Descrição': 'Biography / Description',
    'Portefólio (até 4 fotos dos teus trabalhos — clica para adicionar)': 'Portfolio (up to 4 photos of your work — click to add)',
    'Disponível para trabalhar': 'Available to work',
    'Categoria de Serviço': 'Service Category',
    'Preço por hora / serviço (Kz)': 'Price per hour / service (Kz)',
    'Guardado com sucesso!': 'Saved successfully!',
    'Senha Actual': 'Current Password',
    'Nova Senha': 'New Password',
    'Confirmar Nova Senha': 'Confirm New Password',
    'Alterar Senha': 'Change Password',
    'Terminar Sessão': 'Log Out',
    'Eliminar Conta': 'Delete Account',
    'Esta acção é permanente e irreversível. O teu perfil, dados e histórico serão apagados. O teu email fica livre — podes criar uma nova conta quando quiseres.': 'This action is permanent and irreversible. Your profile, data and history will be deleted. Your email is freed — you can create a new account whenever you wish.',
    'Eliminar a minha conta': 'Delete my account',
    'Confirma a tua identidade para continuar': 'Confirm your identity to continue',
    'Eliminar definitivamente': 'Delete permanently',
    'O teu nome completo': 'Your full name',
    '244 9XX XXX XXX': '244 9XX XXX XXX',
    'Ex: Luanda, Talatona': 'E.g.: Luanda, Talatona',
    'Apresenta-te brevemente — quem és, o que fazes, a tua experiência…': 'Introduce yourself briefly — who you are, what you do, your experience…',
    'https://exemplo.com/foto.jpg': 'https://example.com/photo.jpg',
    'A tua senha actual': 'Your current password',
    'Nova senha (mín. 6 caracteres)': 'New password (min. 6 characters)',
    'Repete a nova senha': 'Repeat the new password',
    'Insere a tua senha para confirmar.': 'Enter your password to confirm.',
    'Senha incorrecta.': 'Incorrect password.',
    'Sessão expirada. Faz logout e login novamente.': 'Session expired. Log out and log in again.',
    'Demasiadas tentativas. Tenta mais tarde.': 'Too many attempts. Try again later.',
    'Erro ao eliminar conta. Tenta novamente.': 'Error deleting account. Please try again.',
    'Fala Connosco!': 'Talk to Us!',
    'Canalização': 'Plumbing',
    'Carpintaria': 'Carpentry',
    'Jardinagem': 'Gardening',
    'Beleza & Estética': 'Beauty & Aesthetics',
    'Saúde & Bem-estar': 'Health & Wellness',

    /* ── PERFIL-PRESTADOR: UI ── */
    'Voltar aos prestadores': 'Back to providers',
    'Contactar no WhatsApp': 'Contact on WhatsApp',
    'Ligar': 'Call',
    'Fazer Pedido': 'Make a Request',
    'Copiar link': 'Copy link',
    'Sobre o Prestador': 'About the Provider',
    'Portefólio de Trabalhos': 'Work Portfolio',
    'Avaliações dos Clientes': 'Client Reviews',
    'Deixar uma avaliação': 'Leave a review',
    'Comentário': 'Comment',
    'Submeter Avaliação': 'Submit Review',
    'Partilha a tua experiência com este prestador…': 'Share your experience with this provider…',
    'Preço a partir de': 'Price from',
    'Partilhar': 'Share',
    'Prestador': 'Provider',
    'Cliente': 'Client',

    /* ── DASHBOARD: LABELS ── */
    'Carregando…': 'Loading…',
    'A mostrar todos os prestadores': 'Showing all providers',
    'Avaliação Média': 'Average Rating',
    'Prestador de serviços': 'Service provider',
    'Dashboard': 'Dashboard',
    'Conta': 'Account',
  };

  /* ------------------------------------------
     CORE FUNCTIONS
  ------------------------------------------ */
  function getCurrentLang() {
    return localStorage.getItem(KEY) || 'pt';
  }

  function setLang(lang) {
    if (lang === getCurrentLang()) return;
    localStorage.setItem(KEY, lang);
    // Briefly hide body to prevent PT→EN flash on reload
    document.documentElement.style.opacity = '0';
    location.reload();
  }

  function applyTranslations() {
    if (getCurrentLang() !== 'en') return;

    // 1. Translate text nodes
    translateTextNodes(document.body);

    // 2. Translate placeholder attributes
    document.querySelectorAll('[placeholder]').forEach(function (el) {
      var ph = el.placeholder.trim();
      if (dict[ph]) el.placeholder = dict[ph];
    });

    // 3. Translate title attributes
    document.querySelectorAll('[title]').forEach(function (el) {
      var t = el.title.trim();
      if (dict[t]) el.title = dict[t];
    });

    // 4. Translate aria-label attributes
    document.querySelectorAll('[aria-label]').forEach(function (el) {
      var a = el.getAttribute('aria-label').trim();
      if (dict[a]) el.setAttribute('aria-label', dict[a]);
    });

    // 5. Translate <option> elements
    document.querySelectorAll('option').forEach(function (el) {
      var text = el.textContent.trim();
      if (dict[text]) el.textContent = dict[text];
    });

    // 6. Update page <title>
    var titleMap = {
      'index.html':              'Conecta Já — Find Service Providers in Angola',
      'prestadores.html':        'Providers — Conecta Já',
      'sobre.html':              'About Us — Conecta Já',
      'blog.html':               'Blog — Conecta Já',
      'faq.html':                'FAQ — Conecta Já',
      'contacto.html':           'Contact — Conecta Já',
      'seguranca.html':          'Security — Conecta Já',
      'privacidade.html':        'Privacy Policy — Conecta Já',
      'termos.html':             'Terms of Use — Conecta Já',
      'meu-perfil.html':         'My Profile — Conecta Já',
      'dashboard-client.html':   'Dashboard — Conecta Já',
      'dashboard-provider.html': 'Provider Dashboard — Conecta Já',
      'perfil-prestador.html':   'Provider Profile — Conecta Já',
    };
    var page = location.pathname.split('/').pop() || 'index.html';
    if (titleMap[page]) document.title = titleMap[page];
  }

  function normalizeWS(str) {
    return str.replace(/\s+/g, ' ').trim();
  }

  function translateTextNodes(root) {
    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          var tag = node.parentNode && node.parentNode.nodeName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
            return NodeFilter.FILTER_REJECT;
          }
          if (!node.textContent.trim()) return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var original   = node.textContent;
      var trimmed    = original.trim();
      var normalized = normalizeWS(original);
      var translation = dict[trimmed] || (normalized !== trimmed ? dict[normalized] : null);
      if (translation) {
        node.textContent = original.replace(trimmed, translation);
      }
    });
  }

  function updateDropdownUI() {
    var lang = getCurrentLang();
    var flagEl = document.querySelector('#langToggle .lang-flag');
    var codeEl = document.querySelector('#langToggle .lang-code');
    if (flagEl) flagEl.textContent = lang === 'pt' ? '🇵🇹' : '🇬🇧';
    if (codeEl) codeEl.textContent = lang.toUpperCase();
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-set-lang') === lang);
    });
  }

  function init() {
    // Reveal page (hidden by anti-flash script)
    document.documentElement.style.opacity = '';

    applyTranslations();
    updateDropdownUI();

    var toggle = document.getElementById('langToggle');
    var menu   = document.getElementById('langMenu');

    if (toggle && menu) {
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
      });

      document.addEventListener('click', function () {
        menu.classList.remove('open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
    }

    document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        setLang(btn.getAttribute('data-set-lang'));
      });
    });
  }

  return { init: init, getCurrentLang: getCurrentLang, setLang: setLang };
})();
