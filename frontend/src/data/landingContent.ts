export interface LandingContent {
  hero: {
    title: string
    subtitle: string
    description: string
    ctaPrimary: string
    ctaSecondary: string
  }
  services: {
    title: string
    subtitle: string
    items: Array<{
      id: string
      title: string
      description: string
      icon: string
      link: string
    }>
  }
  benefits: {
    title: string
    subtitle: string
    items: Array<{
      id: string
      title: string
      description: string
      icon: string
    }>
  }
  stats: {
    title: string
    items: Array<{
      id: string
      value: string
      label: string
      icon: string
    }>
  }
  news: {
    title: string
    viewAllText: string
    items: Array<{
      id: string
      title: string
      excerpt: string
      date: string
      category: string
      image: string
    }>
  }
  partners: {
    title: string
    subtitle: string
    logos: Array<{
      id: string
      name: string
      logo: string
      url?: string
    }>
  }
  testimonials: {
    title: string
    items: Array<{
      id: string
      name: string
      position: string
      company: string
      content: string
      avatar: string
      rating: number
    }>
  }
  cta: {
    title: string
    subtitle: string
    buttonText: string
    buttonLink: string
  }
}

export const landingContent: LandingContent = {
  hero: {
    title: "Комплексная поддержка бизнеса в Казахстане",
    subtitle: "Единая платформа для получения государственной поддержки предпринимательства",
    description: "Найдите подходящие программы грантов, субсидий и льгот для развития вашего бизнеса. Подавайте заявки онлайн и получайте персональные рекомендации от экспертов.",
    ctaPrimary: "Найти программы",
    ctaSecondary: "Как это работает"
  },
  services: {
    title: "Наши услуги",
    subtitle: "Полный спектр программ поддержки для развития вашего бизнеса",
    items: [
      {
        id: "grants",
        title: "Гранты для бизнеса",
        description: "Безвозмездное финансирование до 3 млн тенге для стартапов и действующих предприятий",
        icon: "Award",
        link: "/grants"
      },
      {
        id: "subsidies", 
        title: "Субсидирование процентной ставки",
        description: "Компенсация части процентной ставки по банковским кредитам до 6% годовых",
        icon: "TrendingUp",
        link: "/subsidies"
      },
      {
        id: "consultation",
        title: "Консультационная поддержка",
        description: "Бесплатные консультации экспертов по развитию бизнеса и оформлению документов",
        icon: "MessageCircle",
        link: "/consultation"
      },
      {
        id: "training",
        title: "Обучение и менторство",
        description: "Образовательные программы и менторская поддержка для предпринимателей",
        icon: "BookOpen",
        link: "/training"
      }
    ]
  },
  benefits: {
    title: "Преимущества нашей платформы",
    subtitle: "Почему предприниматели выбирают BusinessSupport KZ",
    items: [
      {
        id: "unified",
        title: "Единое окно",
        description: "Все программы поддержки в одном месте. Не нужно искать по разным сайтам",
        icon: "Layers"
      },
      {
        id: "personalized",
        title: "Персональные рекомендации",
        description: "ИИ-алгоритм подберет программы специально для вашего бизнеса",
        icon: "Target"
      },
      {
        id: "digital",
        title: "Цифровая подача",
        description: "Подавайте заявки онлайн без посещения офисов и очередей",
        icon: "Smartphone"
      },
      {
        id: "tracking",
        title: "Отслеживание статуса",
        description: "Следите за рассмотрением заявок в реальном времени",
        icon: "Eye"
      },
      {
        id: "support",
        title: "Экспертная поддержка",
        description: "Получайте помощь на каждом этапе от профильных специалистов",
        icon: "Users"
      },
      {
        id: "free",
        title: "Бесплатно",
        description: "Использование платформы полностью бесплатно для предпринимателей",
        icon: "Heart"
      }
    ]
  },
  stats: {
    title: "Результаты работы платформы",
    items: [
      {
        id: "programs",
        value: "15+",
        label: "Активных программ",
        icon: "Award"
      },
      {
        id: "entrepreneurs",
        value: "2,500+",
        label: "Предпринимателей",
        icon: "Users"
      },
      {
        id: "funding",
        value: "1.2 млрд",
        label: "Тенге поддержки",
        icon: "TrendingUp"
      },
      {
        id: "success",
        value: "87%",
        label: "Успешных заявок",
        icon: "CheckCircle"
      }
    ]
  },
  news: {
    title: "Новости и обновления",
    viewAllText: "Все новости",
    items: [
      {
        id: "news1",
        title: "Запущена новая программа грантов для IT-стартапов",
        excerpt: "Министерство цифрового развития объявило о старте программы поддержки технологических стартапов с грантами до 5 млн тенге",
        date: "2024-03-15",
        category: "Гранты",
        image: "https://via.placeholder.com/400x240/0284c7/ffffff?text=IT+Гранты"
      },
      {
        id: "news2", 
        title: "Изменения в программе субсидирования процентных ставок",
        excerpt: "С 1 апреля 2024 года вступают в силу новые условия субсидирования для малого и среднего бизнеса",
        date: "2024-03-12",
        category: "Субсидии",
        image: "https://via.placeholder.com/400x240/0284c7/ffffff?text=Субсидии"
      },
      {
        id: "news3",
        title: "Открыта регистрация на бесплатные бизнес-тренинги",
        excerpt: "Национальная палата предпринимателей проводит серию обучающих семинаров для начинающих предпринимателей",
        date: "2024-03-10",
        category: "Обучение",
        image: "https://via.placeholder.com/400x240/0284c7/ffffff?text=Обучение"
      },
      {
        id: "news4",
        title: "Новые льготы для экспортеров сельхозпродукции",
        excerpt: "Правительство анонсировало пакет мер поддержки для компаний, занимающихся экспортом сельскохозяйственной продукции",
        date: "2024-03-08",
        category: "Льготы",
        image: "https://via.placeholder.com/400x240/10b981/ffffff?text=Экспорт"
      },
      {
        id: "news5",
        title: "Микрокредитование до 1 млн тенге без залога",
        excerpt: "Фонд Даму запустил новую программу микрокредитования для женщин-предпринимателей и молодежи до 29 лет",
        date: "2024-03-05",
        category: "Кредиты",
        image: "https://via.placeholder.com/400x240/f59e0b/ffffff?text=Микрокредиты"
      },
      {
        id: "news6",
        title: "Цифровизация госуслуг для предпринимателей",
        excerpt: "С апреля все заявки на получение лицензий и разрешений можно будет подавать через единый цифровой портал",
        date: "2024-03-03",
        category: "Цифровизация",
        image: "https://via.placeholder.com/400x240/8b5cf6/ffffff?text=Цифровые+услуги"
      },
      {
        id: "news7",
        title: "Поддержка инновационных проектов в регионах",
        excerpt: "Региональные акиматы получили дополнительное финансирование для поддержки инновационных стартапов",
        date: "2024-03-01",
        category: "Инновации",
        image: "https://via.placeholder.com/400x240/ef4444/ffffff?text=Инновации"
      },
      {
        id: "news8",
        title: "Упрощение налогового администрирования",
        excerpt: "Комитет государственных доходов внедряет новые инструменты для упрощения ведения налогового учета",
        date: "2024-02-28",
        category: "Налоги",
        image: "https://via.placeholder.com/400x240/06b6d4/ffffff?text=Налоги"
      },
      {
        id: "news9",
        title: "Международные гранты для казахстанского бизнеса",
        excerpt: "Открыт прием заявок на участие в международных программах грантового финансирования от ЕС и США",
        date: "2024-02-25",
        category: "Гранты",
        image: "https://via.placeholder.com/400x240/84cc16/ffffff?text=Международные+гранты"
      }
    ]
  },
  partners: {
    title: "Наши партнеры",
    subtitle: "Мы работаем с ведущими организациями для поддержки предпринимательства",
    logos: [
      {
        id: "damu",
        name: "Фонд развития предпринимательства Даму",
        logo: "https://via.placeholder.com/200x80/f8f9fa/6c757d?text=DAMU"
      },
      {
        id: "qoldau",
        name: "Фонд Qoldau",
        logo: "https://via.placeholder.com/200x80/f8f9fa/6c757d?text=QOLDAU"
      },
      {
        id: "baiterek",
        name: "Холдинг Байтерек",
        logo: "https://via.placeholder.com/200x80/f8f9fa/6c757d?text=BAITEREK"
      },
      {
        id: "kdb",
        name: "Банк развития Казахстана",
        logo: "https://via.placeholder.com/200x80/f8f9fa/6c757d?text=KDB"
      },
      {
        id: "atameken",
        name: "НПП Атамекен",
        logo: "https://via.placeholder.com/200x80/f8f9fa/6c757d?text=ATAMEKEN"
      },
      {
        id: "ministry",
        name: "Министерство труда и социальной защиты",
        logo: "https://via.placeholder.com/200x80/f8f9fa/6c757d?text=MINISTRY"
      }
    ]
  },
  testimonials: {
    title: "Отзывы предпринимателей",
    items: [
      {
        id: "test1",
        name: "Айгуль Назарбаева",
        position: "Основатель",
        company: "EcoFarm KZ",
        content: "Благодаря платформе получила грант в 2 млн тенге для развития эко-фермы. Весь процесс занял всего 3 недели!",
        avatar: "https://via.placeholder.com/64x64/0284c7/ffffff?text=АН",
        rating: 5
      },
      {
        id: "test2",
        name: "Марат Казыбеков",
        position: "Директор",
        company: "TechInnovate",
        content: "Платформа помогла найти идеальную программу субсидирования. Сэкономили 40% на процентах по кредиту.",
        avatar: "https://via.placeholder.com/64x64/0284c7/ffffff?text=МК",
        rating: 5
      },
      {
        id: "test3",
        name: "Дина Абдуллина",
        position: "CEO",
        company: "Fashion Studio D",
        content: "Отличная поддержка на всех этапах. Консультанты помогли правильно оформить документы и получить финансирование.",
        avatar: "https://via.placeholder.com/64x64/0284c7/ffffff?text=ДА",
        rating: 5
      }
    ]
  },
  cta: {
    title: "Начните развивать свой бизнес уже сегодня",
    subtitle: "Присоединяйтесь к тысячам успешных предпринимателей Казахстана",
    buttonText: "Зарегистрироваться бесплатно",
    buttonLink: "/register"
  }
}
