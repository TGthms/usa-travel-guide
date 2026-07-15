'use strict';
/**
 * Privacy Policy & Terms of Use — full copy in en / es / zh / ja.
 * Rendered by app.js when body.page-legal is present.
 *
 * Localization notes:
 * - English is the source of legal meaning.
 * - es / zh / ja aim for native legal register (inspired by Apple’s localized
 *   privacy/legal voice: clear, direct, region-appropriate wording) while
 *   preserving the same section structure and substance.
 */
window.LEGAL_I18N = {
  privacy: {
    en: {
      title: 'Privacy Policy',
      eyebrow: 'Legal',
      updatedLabel: 'Updated',
      updatedDate: 'July 11, 2026',
      onThisPage: 'On this page',
      lead: 'This Privacy Policy describes how <strong>America — A Travel Guide</strong> (the “Site,” “we,” “us”) handles information when you visit or use this website, including the guide, photo gallery, and tools. We designed the Site to work well with as little personal data as possible.',
      toc: [
        { id: 'overview', label: 'Overview' },
        { id: 'what-we-collect', label: 'What we collect' },
        { id: 'how-we-use', label: 'How we use information' },
        { id: 'storage', label: 'Where information is stored' },
        { id: 'third-parties', label: 'Third-party services' },
        { id: 'cookies', label: 'Cookies & similar technologies' },
        { id: 'choices', label: 'Your choices' },
        { id: 'children', label: 'Children' },
        { id: 'changes', label: 'Changes to this policy' },
        { id: 'contact', label: 'Contact' }
      ],
      sections: [
        {
          id: 'overview',
          title: 'Overview',
          html: `<p>The Site is an editorial travel guide and photo journal created by <strong>Tim G</strong> (GitHub <a href="https://github.com/TGthms" target="_blank" rel="noopener">@TGthms</a>). It is primarily a static website: most content is delivered as pages and files, and core browsing does not require an account.</p>
<p>We treat as “personal data” any information that identifies you or can reasonably be linked to you. Aggregated or purely technical data that cannot reasonably identify you is not personal data for this policy.</p>`
        },
        {
          id: 'what-we-collect',
          title: 'What we collect',
          html: `<p>Depending on how you use the Site, the following may be involved:</p>
<ul>
<li><strong>Preferences you choose.</strong> Theme, language, units (temperature/distance), motion and cursor preferences, and gallery photo quality may be saved on your device using browser storage (such as <code>localStorage</code>). These settings stay on your device unless you clear site data.</li>
<li><strong>Technical data processed by your browser or host.</strong> Like most websites, standard request information (for example IP address, browser type, and requested URLs) may be processed by the service that hosts or delivers the Site (for example a static host or CDN) for delivery, security, and reliability. We do not operate a separate advertising profile from this Site.</li>
<li><strong>Information you send voluntarily.</strong> If you contact us (for example via GitHub or an external about page), we receive what you choose to include in that message.</li>
<li><strong>No account system.</strong> The Site does not require registration, passwords, or payment information for normal use of the guide, gallery, or tools.</li>
</ul>`
        },
        {
          id: 'how-we-use',
          title: 'How we use information',
          html: `<ul>
<li>To remember your display and accessibility preferences between visits on the same browser.</li>
<li>To provide interactive tools (for example currency conversion, which may call a third-party rate API).</li>
<li>To operate, secure, and improve delivery of the Site through hosting infrastructure.</li>
<li>To respond if you contact us.</li>
</ul>
<p>We do <strong>not</strong> sell your personal data. We do not use the Site’s preference storage for cross-site advertising.</p>`
        },
        {
          id: 'storage',
          title: 'Where information is stored',
          html: `<p>Preference data is stored <strong>locally on your device</strong> by your browser. Hosting providers may process connection logs in the regions where their infrastructure is located. If the Site is served from a public repository or static host (for example GitHub Pages), their respective privacy terms also apply to that hosting.</p>`
        },
        {
          id: 'third-parties',
          title: 'Third-party services',
          html: `<p>The Site may load or contact third-party services necessary for features you use:</p>
<ul>
<li><strong>Fonts.</strong> Web fonts may be loaded from Google Fonts so text displays correctly across languages. That request may include technical data such as your IP address, subject to Google’s policies.</li>
<li><strong>Exchange rates (Tools).</strong> The currency converter may request rates from a public API (for example Frankfurter). Only the currency codes needed for the conversion are sent for that request.</li>
<li><strong>External / outbound links.</strong> For convenience, the Site includes links to third-party websites—including official city tourism bureaus, public-transit agencies, National Park Service pages, museums, GitHub, About Me, and similar resources (for example “Helpful links” on destination cards). Clicking such a link leaves the Site and takes you to a service we do not operate. Those operators may collect information under their own privacy policies; this policy does not cover them. We do not receive your activity on those external sites by virtue of the link alone, and a link does not mean we endorse or control that third party.</li>
</ul>`
        },
        {
          id: 'cookies',
          title: 'Cookies & similar technologies',
          html: `<p>The Site primarily uses <strong>local browser storage</strong> for preferences rather than advertising cookies. Your browser or host may still use cookies or similar technologies for security, load balancing, or session continuity. You can clear site data or block storage in your browser settings; some preferences will then reset on each visit.</p>`
        },
        {
          id: 'choices',
          title: 'Your choices',
          html: `<ul>
<li>Change theme, language, units, motion, and gallery quality anytime in <strong>Settings</strong>.</li>
<li>Clear site data in your browser to remove locally stored preferences.</li>
<li>Disable network access to third-party font or API hosts if you prefer; some features may degrade.</li>
<li>Contact us (below) with privacy questions about this Site.</li>
</ul>`
        },
        {
          id: 'children',
          title: 'Children',
          html: `<p>The Site is a general travel information resource and is not directed at children under 13 (or the equivalent minimum age in your jurisdiction). We do not knowingly collect personal data from children through this Site. If you believe a child has provided personal data, please contact us so we can take appropriate steps.</p>`
        },
        {
          id: 'changes',
          title: 'Changes to this policy',
          html: `<p>We may update this Privacy Policy from time to time. When we do, we will revise the “Updated” date at the top of this page. Continued use of the Site after changes means you acknowledge the updated policy. Material changes may be highlighted on the Site when practical.</p>`
        },
        {
          id: 'contact',
          title: 'Contact',
          html: `<p>For questions about this Privacy Policy or privacy practices related to the Site, please reach out via:</p>
<ul>
<li><a href="mailto:contact.timg@icloud.com">contact.timg@icloud.com</a></li>
<li><a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">GitHub repository</a></li>
</ul>
<p class="legal-note">This policy is provided for transparency about a personal project website. It is not legal advice.</p>`
        }
      ],
      footerNote: '© 2026 USA Travel Guide · Tim G (TGthms)'
    },
    es: {
      title: 'Política de privacidad',
      eyebrow: 'Legal',
      updatedLabel: 'Actualización',
      updatedDate: '11 de julio de 2026',
      onThisPage: 'En esta página',
      lead: 'Tu privacidad es importante. Esta Política de privacidad explica con claridad cómo <strong>América — Una Guía de Viaje</strong> (el “Sitio”, “nosotros”) recopila, usa, revela, transmite y guarda la información cuando visitas o usas este sitio web —incluida la guía, la galería de fotos y las herramientas—. Diseñamos el Sitio para funcionar bien con la menor cantidad posible de datos personales.',
      toc: [
        { id: 'overview', label: 'Descripción general' },
        { id: 'what-we-collect', label: 'Información que recopilamos' },
        { id: 'how-we-use', label: 'Cómo usamos la información' },
        { id: 'storage', label: 'Dónde se guarda la información' },
        { id: 'third-parties', label: 'Servicios de terceros' },
        { id: 'cookies', label: 'Cookies y tecnologías similares' },
        { id: 'choices', label: 'Tus opciones' },
        { id: 'children', label: 'Menores de edad' },
        { id: 'changes', label: 'Cambios en esta política' },
        { id: 'contact', label: 'Contacto' }
      ],
      sections: [
        {
          id: 'overview',
          title: 'Descripción general',
          html: `<p>El Sitio es una guía de viaje editorial y un diario fotográfico creado por <strong>Tim G</strong> (GitHub <a href="https://github.com/TGthms" target="_blank" rel="noopener">@TGthms</a>). Es, sobre todo, un sitio estático: la mayor parte del contenido se entrega como páginas y archivos, y no hace falta una cuenta para navegar por lo esencial.</p>
<p>Consideramos “datos personales” cualquier información que te identifique o que pueda asociarse razonablemente a ti. Los datos agregados o meramente técnicos que no permitan identificarte de forma razonable no se tratan como datos personales en esta política.</p>`
        },
        {
          id: 'what-we-collect',
          title: 'Información que recopilamos',
          html: `<p>Según cómo uses el Sitio, puede intervenir lo siguiente:</p>
<ul>
<li><strong>Preferencias que eliges.</strong> El tema, el idioma, las unidades (temperatura y distancia), las preferencias de animación y del cursor, y la calidad de las fotos de la galería pueden guardarse en tu dispositivo con el almacenamiento del navegador (por ejemplo, <code>localStorage</code>). Esas preferencias permanecen en tu dispositivo a menos que borres los datos del sitio.</li>
<li><strong>Datos técnicos del navegador o del alojamiento.</strong> Como en la mayoría de los sitios web, el servicio que aloja o entrega el Sitio (por ejemplo, un host estático o una CDN) puede procesar información habitual de las solicitudes —como la dirección IP, el tipo de navegador y las URL solicitadas— para la entrega, la seguridad y la fiabilidad. No elaboramos un perfil publicitario a partir de este Sitio.</li>
<li><strong>Información que envías de forma voluntaria.</strong> Si te pones en contacto con nosotros (por ejemplo, a través de GitHub o de una página externa “Sobre mí”), recibimos lo que decidas incluir en ese mensaje.</li>
<li><strong>Sin cuentas de usuario.</strong> El uso habitual de la guía, la galería o las herramientas no exige registro, contraseñas ni datos de pago.</li>
</ul>`
        },
        {
          id: 'how-we-use',
          title: 'Cómo usamos la información',
          html: `<ul>
<li>Recordar tus preferencias de visualización y accesibilidad entre visitas en el mismo navegador.</li>
<li>Ofrecer herramientas interactivas (por ejemplo, la conversión de divisas, que puede consultar una API de tipos de cambio de terceros).</li>
<li>Operar, proteger y mejorar la entrega del Sitio a través de la infraestructura de alojamiento.</li>
<li>Responder cuando nos escribes.</li>
</ul>
<p><strong>No vendemos</strong> tus datos personales. Tampoco usamos el almacenamiento de preferencias del Sitio para publicidad entre sitios.</p>`
        },
        {
          id: 'storage',
          title: 'Dónde se guarda la información',
          html: `<p>Las preferencias se guardan <strong>en tu dispositivo</strong>, de forma local, a través del navegador. Los proveedores de alojamiento pueden procesar registros de conexión en las regiones donde se encuentra su infraestructura. Si el Sitio se publica desde un repositorio público o un host estático (por ejemplo, GitHub Pages), también se aplican las políticas de privacidad de ese proveedor al alojamiento.</p>`
        },
        {
          id: 'third-parties',
          title: 'Servicios de terceros',
          html: `<p>El Sitio puede cargar o contactar servicios de terceros necesarios para las funciones que uses:</p>
<ul>
<li><strong>Fuentes tipográficas.</strong> Pueden cargarse fuentes web desde Google Fonts para mostrar correctamente el texto en varios idiomas. Esa solicitud puede incluir datos técnicos como tu dirección IP, sujetos a las políticas de Google.</li>
<li><strong>Tipos de cambio (Herramientas).</strong> El conversor de divisas puede solicitar cotizaciones a una API pública (por ejemplo, Frankfurter). Solo se envían los códigos de moneda necesarios para la conversión.</li>
<li><strong>Enlaces a sitios externos.</strong> Para tu comodidad, el Sitio incluye enlaces a sitios de terceros —oficinas oficiales de turismo, agencias de transporte, páginas del National Park Service, museos, GitHub, “Sobre mí” y recursos similares (por ejemplo, “Enlaces útiles” en las tarjetas de destinos). Al seguir un enlace de ese tipo, abandonas el Sitio y pasas a un servicio que no operamos. Esos operadores pueden recopilar información conforme a sus propias políticas de privacidad; esta política no los cubre. El simple hecho de que exista un enlace no nos da acceso a tu actividad en esos sitios, ni implica que respaldemos o controlemos a ese tercero.</li>
</ul>`
        },
        {
          id: 'cookies',
          title: 'Cookies y tecnologías similares',
          html: `<p>El Sitio prioriza el <strong>almacenamiento local del navegador</strong> para las preferencias, no las cookies publicitarias. Aun así, tu navegador o el host pueden usar cookies o tecnologías similares por seguridad, reparto de carga o continuidad de sesión. Puedes borrar los datos del sitio o limitar el almacenamiento en la configuración del navegador; en ese caso, algunas preferencias se reiniciarán en cada visita.</p>`
        },
        {
          id: 'choices',
          title: 'Tus opciones',
          html: `<ul>
<li>Cambia el tema, el idioma, las unidades, el movimiento y la calidad de la galería cuando quieras en <strong>Ajustes</strong>.</li>
<li>Borra los datos del sitio en el navegador para eliminar las preferencias guardadas en el dispositivo.</li>
<li>Si lo prefieres, puedes restringir el acceso de red a fuentes o API de terceros; algunas funciones podrían limitarse.</li>
<li>Escríbenos (más abajo) si tienes preguntas de privacidad sobre este Sitio.</li>
</ul>`
        },
        {
          id: 'children',
          title: 'Menores de edad',
          html: `<p>El Sitio es un recurso general de información de viajes y no está dirigido a menores de 13 años (o la edad mínima equivalente en tu jurisdicción). No recopilamos a sabiendas datos personales de menores a través de este Sitio. Si crees que un menor ha facilitado datos personales, contáctanos para que podamos actuar de forma adecuada.</p>`
        },
        {
          id: 'changes',
          title: 'Cambios en esta política',
          html: `<p>Podemos actualizar esta Política de privacidad periódicamente. Cuando lo hagamos, modificaremos la fecha de “Actualización” al inicio de esta página. Si sigues usando el Sitio después de un cambio, reconoces la política actualizada. Cuando sea práctico, podremos destacar en el Sitio los cambios más relevantes.</p>`
        },
        {
          id: 'contact',
          title: 'Contacto',
          html: `<p>Si tienes preguntas sobre esta Política de privacidad o sobre las prácticas de privacidad del Sitio, puedes escribirnos a:</p>
<ul>
<li><a href="mailto:contact.timg@icloud.com">contact.timg@icloud.com</a></li>
<li><a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">Repositorio en GitHub</a></li>
</ul>
<p class="legal-note">Esta política se ofrece para dar transparencia sobre un sitio de proyecto personal. No constituye asesoramiento jurídico.</p>`
        }
      ],
      footerNote: '© 2026 USA Travel Guide · Tim G (TGthms)'
    },
    zh: {
      title: '隐私政策',
      eyebrow: '法律信息',
      updatedLabel: '更新日期',
      updatedDate: '2026年7月11日',
      onThisPage: '本页内容',
      lead: '我们重视你的隐私。本《隐私政策》清楚说明<strong>美国 — 旅行指南</strong>（以下简称“本网站”“我们”）在你访问或使用本网站（包括指南、相册与工具）时，如何收集、使用、披露、传输与保存相关信息。我们尽量在少处理个人数据的前提下，让本网站顺畅可用。',
      toc: [
        { id: 'overview', label: '概述' },
        { id: 'what-we-collect', label: '我们收集的信息' },
        { id: 'how-we-use', label: '我们如何使用信息' },
        { id: 'storage', label: '信息如何保存' },
        { id: 'third-parties', label: '第三方服务' },
        { id: 'cookies', label: 'Cookie 与类似技术' },
        { id: 'choices', label: '你的选择' },
        { id: 'children', label: '儿童' },
        { id: 'changes', label: '政策更新' },
        { id: 'contact', label: '联系我们' }
      ],
      sections: [
        {
          id: 'overview',
          title: '概述',
          html: `<p>本网站是由 <strong>Tim G</strong>（GitHub <a href="https://github.com/TGthms" target="_blank" rel="noopener">@TGthms</a>）制作的编辑型旅行指南与影像手记。内容以静态页面与文件为主；浏览指南与相册等核心功能无需注册账户。</p>
<p>我们将任何可识别你身份、或可合理关联到你的信息视为“个人数据”。无法合理识别个人的汇总信息，或纯粹的技术性数据，在本政策中不作为个人数据对待。</p>`
        },
        {
          id: 'what-we-collect',
          title: '我们收集的信息',
          html: `<p>取决于你如何使用本网站，可能涉及以下信息：</p>
<ul>
<li><strong>你选择的偏好。</strong>主题、语言、单位（温度／距离）、动效与光标偏好、相册画质等，可能通过浏览器本地存储（例如 <code>localStorage</code>）保存在你的设备上。除非你清除本网站数据，这些设置会留在本机。</li>
<li><strong>浏览器或托管方处理的技术数据。</strong>与多数网站一样，托管或分发本网站的服务（例如静态托管或 CDN）可能处理常规请求信息（如 IP 地址、浏览器类型、请求 URL），用于内容交付、安全与稳定运行。我们不会基于本网站建立独立的广告画像。</li>
<li><strong>你主动提供的信息。</strong>若你通过 GitHub 或外部“关于我”页面与我们联系，我们会收到你在消息中自愿填写的内容。</li>
<li><strong>无需账户。</strong>正常使用指南、相册或工具时，不需要注册、密码或支付信息。</li>
</ul>`
        },
        {
          id: 'how-we-use',
          title: '我们如何使用信息',
          html: `<ul>
<li>在同一浏览器中记住你的显示与无障碍相关偏好。</li>
<li>提供互动工具（例如货币换算；该功能可能调用第三方汇率接口）。</li>
<li>通过托管基础设施运营、保护并改进网站访问体验。</li>
<li>在你联系我们时作出回复。</li>
</ul>
<p>我们<strong>不会出售</strong>你的个人数据，也不会把本网站的偏好存储用于跨站广告。</p>`
        },
        {
          id: 'storage',
          title: '信息如何保存',
          html: `<p>偏好数据由浏览器<strong>保存在你的本地设备</strong>。托管服务商可能在其基础设施所在地区处理连接日志。若本网站通过公共代码仓库或静态托管（例如 GitHub Pages）提供访问，则该托管方的隐私政策也适用于相应的托管服务。</p>`
        },
        {
          id: 'third-parties',
          title: '第三方服务',
          html: `<p>为实现你使用的功能，本网站可能加载或访问第三方服务：</p>
<ul>
<li><strong>字体。</strong>为正确显示多语言文字，可能从 Google Fonts 加载网络字体。相关请求可能包含 IP 地址等技术数据，并受 Google 相关政策约束。</li>
<li><strong>汇率（工具页）。</strong>货币换算器可能向公开接口（例如 Frankfurter）请求汇率，且仅发送完成换算所需的货币代码。</li>
<li><strong>站外链接。</strong>为方便规划行程，本网站会提供指向第三方网站的链接，例如城市官方旅游网站、公共交通机构、美国国家公园管理局页面、博物馆、GitHub、“关于我”，以及目的地卡片中的“实用链接”等。点击此类链接即离开本网站，进入我们不运营的服务。那些运营方可能按其自身隐私政策处理信息；本政策不适用于它们。链接本身并不会让我们获知你在外部网站上的活动，也不表示我们认可或控制该第三方。</li>
</ul>`
        },
        {
          id: 'cookies',
          title: 'Cookie 与类似技术',
          html: `<p>本网站主要使用<strong>浏览器本地存储</strong>保存偏好，而不是以广告 Cookie 为目的。你的浏览器或托管方仍可能出于安全、负载均衡或会话连续性等原因使用 Cookie 或类似技术。你可以在浏览器中清除本网站数据，或限制存储；之后部分偏好会在每次访问时恢复为默认。</p>`
        },
        {
          id: 'choices',
          title: '你的选择',
          html: `<ul>
<li>随时在<strong>设置</strong>中更改主题、语言、单位、动效与相册画质。</li>
<li>在浏览器中清除本网站数据，以删除保存在本机的偏好。</li>
<li>如有需要，可限制对第三方字体或接口的网络访问；部分功能可能因此受限。</li>
<li>如对本网站隐私事宜有疑问，欢迎通过下方方式联系我们。</li>
</ul>`
        },
        {
          id: 'children',
          title: '儿童',
          html: `<p>本网站提供一般性旅行信息，并非面向 13 岁以下儿童（或以你所在地区法律规定的同等最低年龄为准）。我们不会通过本网站有意收集儿童的个人数据。若你认为儿童向我们提供了个人数据，请与我们联系，以便我们采取适当措施。</p>`
        },
        {
          id: 'changes',
          title: '政策更新',
          html: `<p>我们可能会不时更新本《隐私政策》。更新时，我们会修改本页顶部的“更新日期”。更新后你如继续使用本网站，即表示你知悉更新后的政策。如有重大变更，我们会在可行时在网站上予以提示。</p>`
        },
        {
          id: 'contact',
          title: '联系我们',
          html: `<p>如对本《隐私政策》或本网站的隐私实践有疑问，请通过以下方式联系：</p>
<ul>
<li><a href="mailto:contact.timg@icloud.com">contact.timg@icloud.com</a></li>
<li><a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">GitHub 仓库</a></li>
</ul>
<p class="legal-note">本政策旨在提高个人项目网站的透明度，不构成法律意见。</p>`
        }
      ],
      footerNote: '© 2026 USA Travel Guide · Tim G (TGthms)'
    },
    ja: {
      title: 'プライバシーポリシー',
      eyebrow: 'リーガル',
      updatedLabel: '更新日',
      updatedDate: '2026年7月11日',
      onThisPage: 'このページの内容',
      lead: 'お客様のプライバシーを大切にしています。本プライバシーポリシーでは、<strong>アメリカ — 旅行ガイド</strong>（以下「本サイト」）が、ガイド・フォトギャラリー・ツールを含む本ウェブサイトのご利用時に、情報をどのように収集、利用、開示、移転、保存するかを明確にご説明します。本サイトは、できるだけ少ない個人データで快適にご利用いただけるよう設計されています。',
      toc: [
        { id: 'overview', label: '概要' },
        { id: 'what-we-collect', label: '収集する情報' },
        { id: 'how-we-use', label: '情報の利用目的' },
        { id: 'storage', label: '情報の保存場所' },
        { id: 'third-parties', label: '第三者サービス' },
        { id: 'cookies', label: 'Cookie 等の技術' },
        { id: 'choices', label: 'お客様の選択' },
        { id: 'children', label: 'お子様について' },
        { id: 'changes', label: 'ポリシーの変更' },
        { id: 'contact', label: 'お問い合わせ' }
      ],
      sections: [
        {
          id: 'overview',
          title: '概要',
          html: `<p>本サイトは、<strong>Tim G</strong>（GitHub <a href="https://github.com/TGthms" target="_blank" rel="noopener">@TGthms</a>）が制作する編集型の旅行ガイド兼フォトジャーナルです。主に静的サイトとして提供され、大半のコンテンツはページとファイルとして配信されます。基本的な閲覧にアカウントは不要です。</p>
<p>本ポリシーでは、お客様を識別できる情報、または合理的にお客様に結び付けられる情報を「個人データ」として扱います。個人を合理的に特定できない集計データや、純粋に技術的なデータは、個人データには含めません。</p>`
        },
        {
          id: 'what-we-collect',
          title: '収集する情報',
          html: `<p>ご利用の状況に応じて、次のような情報が関わる場合があります。</p>
<ul>
<li><strong>お客様が選択する設定。</strong>テーマ、言語、単位（気温・距離）、モーション／カーソル設定、ギャラリーの画質などは、ブラウザの保存領域（例：<code>localStorage</code>）によりお客様の端末に保存されることがあります。サイトデータを消去しない限り、端末上に残ります。</li>
<li><strong>ブラウザまたはホストが処理する技術データ。</strong>多くのウェブサイトと同様、配信・セキュリティ・安定稼働のため、ホストや CDN 等が標準的なリクエスト情報（IP アドレス、ブラウザの種類、要求 URL など）を処理する場合があります。本サイトから別途の広告プロフィールを構築することはありません。</li>
<li><strong>任意で送信される情報。</strong>GitHub や外部の About ページなどからご連絡いただいた場合、そのメッセージに含まれる内容を受領します。</li>
<li><strong>アカウント不要。</strong>ガイド・ギャラリー・ツールの通常のご利用に、登録・パスワード・お支払い情報は不要です。</li>
</ul>`
        },
        {
          id: 'how-we-use',
          title: '情報の利用目的',
          html: `<ul>
<li>同一ブラウザでの表示およびアクセシビリティ設定の記憶</li>
<li>インタラクティブなツールの提供（例：通貨換算。第三者の為替 API を利用する場合があります）</li>
<li>ホスティング基盤を通じた本サイトの運用、保護、配信の改善</li>
<li>お問い合わせへの対応</li>
</ul>
<p>個人データの<strong>販売は行いません</strong>。本サイトの設定保存をクロスサイト広告に使用することもありません。</p>`
        },
        {
          id: 'storage',
          title: '情報の保存場所',
          html: `<p>設定データは、ブラウザにより<strong>お客様の端末上にローカル保存</strong>されます。ホスティング事業者は、そのインフラが所在する地域で接続ログを処理する場合があります。公開リポジトリや静的ホスト（例：GitHub Pages）経由で提供される場合、当該ホストのプライバシー条件もホスティングに適用されます。</p>`
        },
        {
          id: 'third-parties',
          title: '第三者サービス',
          html: `<p>ご利用機能のため、次のような第三者サービスを読み込んだり接続したりする場合があります。</p>
<ul>
<li><strong>フォント。</strong>多言語を正しく表示するため、Google Fonts からウェブフォントを読み込むことがあります。その際、IP アドレス等の技術データが含まれる場合があり、Google の方針が適用されます。</li>
<li><strong>為替（ツール）。</strong>通貨換算は、公開 API（例：Frankfurter）にレートを問い合わせることがあります。換算に必要な通貨コードのみを送信します。</li>
<li><strong>外部サイトへのリンク。</strong>便宜のため、本サイトは第三者ウェブサイトへのリンクを含みます（都市の公式観光サイト、公共交通機関、National Park Service のページ、博物館、GitHub、About Me、目的地カードの「役立つリンク」など）。そのようなリンクをクリックすると本サイトを離れ、当方が運営していないサービスへ移動します。各運営者は独自のプライバシーポリシーに基づき情報を取り扱う場合があり、本ポリシーの対象外です。リンクがあること自体により、外部サイト上でのお客様の行動を当方が受け取ることはなく、リンクは当該第三者の推奨や管理を意味しません。</li>
</ul>`
        },
        {
          id: 'cookies',
          title: 'Cookie 等の技術',
          html: `<p>本サイトは主に設定のために<strong>ブラウザのローカル保存</strong>を用い、広告を目的とした Cookie の利用を主眼としていません。ただし、ブラウザやホストは、セキュリティ、負荷分散、セッション維持などのために Cookie 等を用いる場合があります。ブラウザでサイトデータを消去したり、保存を制限したりできます（その場合、一部の設定は訪問のたびにリセットされます）。</p>`
        },
        {
          id: 'choices',
          title: 'お客様の選択',
          html: `<ul>
<li><strong>設定</strong>から、テーマ・言語・単位・モーション・ギャラリー画質をいつでも変更できます。</li>
<li>ブラウザでサイトデータを消去し、端末に保存された設定を削除できます。</li>
<li>第三者フォントや API への通信を制限することもできます（一部機能が制限される場合があります）。</li>
<li>本サイトのプライバシーに関するご質問は、下記までお問い合わせください。</li>
</ul>`
        },
        {
          id: 'children',
          title: 'お子様について',
          html: `<p>本サイトは一般的な旅行情報であり、13 歳未満（またはお住まいの法域で定められる同等の最低年齢）のお子様を対象としていません。本サイトを通じて故意にお子様の個人データを収集することはありません。お子様の個人データが提供されたと思われる場合は、適切な対応ができるようご連絡ください。</p>`
        },
        {
          id: 'changes',
          title: 'ポリシーの変更',
          html: `<p>本プライバシーポリシーは、必要に応じて更新されることがあります。更新する際は、ページ上部の「更新日」を改めます。変更後も本サイトをご利用いただくことは、更新後のポリシーを認識したものとみなします。重要な変更については、可能な範囲でサイト上でもお知らせします。</p>`
        },
        {
          id: 'contact',
          title: 'お問い合わせ',
          html: `<p>本プライバシーポリシー、または本サイトのプライバシーに関するご質問は、次の方法でご連絡ください。</p>
<ul>
<li><a href="mailto:contact.timg@icloud.com">contact.timg@icloud.com</a></li>
<li><a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">GitHub リポジトリ</a></li>
</ul>
<p class="legal-note">本ポリシーは個人プロジェクトのウェブサイトの透明性のためのものであり、法的助言ではありません。</p>`
        }
      ],
      footerNote: '© 2026 USA Travel Guide · Tim G (TGthms)'
    }
  },

  terms: {
    en: {
      title: 'Terms of Use',
      eyebrow: 'Legal',
      updatedLabel: 'Updated',
      updatedDate: 'July 11, 2026',
      onThisPage: 'On this page',
      lead: 'These Terms of Use (“Terms”) govern your access to and use of <strong>America — A Travel Guide</strong> (the “Site”), including the main guide, photo gallery, tools, and related pages operated by <strong>Tim G</strong> (GitHub <a href="https://github.com/TGthms" target="_blank" rel="noopener">@TGthms</a>). By using the Site, you agree to these Terms. If you do not agree, please do not use the Site.',
      toc: [
        { id: 'agreement', label: 'Agreement to terms' },
        { id: 'ownership', label: 'Ownership of the Site' },
        { id: 'photos', label: 'Photographs & visual content' },
        { id: 'software', label: 'Site software & code' },
        { id: 'travel', label: 'Travel information disclaimer' },
        { id: 'acceptable-use', label: 'Acceptable use' },
        { id: 'third-party', label: 'Third-party links & tools' },
        { id: 'privacy', label: 'Privacy' },
        { id: 'disclaimers', label: 'Disclaimers' },
        { id: 'liability', label: 'Limitation of liability' },
        { id: 'changes', label: 'Changes' },
        { id: 'contact', label: 'Contact' }
      ],
      sections: [
        {
          id: 'agreement',
          title: 'Agreement to terms',
          html: `<p>These Terms apply to the Site as made available online (including any mirror or static hosting of the project). We may update these Terms from time to time by posting a revised version on this page and updating the date above. Your continued use after changes constitutes acceptance of the revised Terms.</p>
<p>As long as you comply with these Terms, we grant you a personal, non-exclusive, non-transferable, limited right to access and use the Site for your own personal, non-commercial purposes.</p>`
        },
        {
          id: 'ownership',
          title: 'Ownership of the Site',
          html: `<p>The Site—including its text, layout, design, user interface, logos, graphics, compilation of content, and original editorial material—is owned by Tim G / TGthms or used under license, and is protected by copyright and other intellectual property laws.</p>
<p>Except as expressly allowed in these Terms or under a stated open license for a specific component, you may not copy, reproduce, republish, upload, post, publicly display, encode, translate, transmit, or distribute any part of the Site for commercial purposes without prior written permission.</p>`
        },
        {
          id: 'photos',
          title: 'Photographs & visual content',
          html: `<p>Photographs and related visual works in the gallery and elsewhere on the Site (including files under <code>images/</code>) are <strong>© 2026 Tim G (GitHub @TGthms)</strong> unless a different credit is shown for a specific work.</p>
<p>Those photographs are made available under the <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">Creative Commons Attribution 4.0 International (CC BY 4.0)</a> license. In plain language, you may share and adapt the photos—including for commercial use—provided that you:</p>
<ul>
<li>Give appropriate credit to <strong>Tim G / @TGthms</strong>;</li>
<li>Provide a link to the CC BY 4.0 license where practical;</li>
<li>Indicate if changes were made; and</li>
<li>Do not suggest that the author endorses you or your use.</li>
</ul>
<p>Suggested attribution: <em>“Photo © Tim G (@TGthms), licensed under CC BY 4.0.”</em></p>
<p>Removing watermarks, false attribution, or using photos in a way that violates applicable law is not permitted. If you need rights beyond CC BY 4.0, contact us.</p>`
        },
        {
          id: 'software',
          title: 'Site software & code',
          html: `<p>Source code for the Site project may be published under an open-source license (for example the <a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">MIT License</a> accompanying the repository). Open-source licenses govern the software itself; they do <strong>not</strong> automatically place photographs under that same license. Photo rights remain as described in the section above unless a file’s notice states otherwise.</p>`
        },
        {
          id: 'travel',
          title: 'Travel information disclaimer',
          html: `<p>Content on the Site—including destinations, seasons, routes, tips, visa notes, costs, tools, and practical information—is provided for <strong>general informational and educational purposes</strong> only. It is not professional legal, immigration, medical, financial, or safety advice.</p>
<ul>
<li>Travel rules, prices, hours, road conditions, and requirements change frequently.</li>
<li>Always verify critical details with official government sources, carriers, and local authorities before you travel.</li>
<li>Interactive tools (currency, tip, drive cost, clocks) produce estimates only and may be incomplete or outdated.</li>
<li>Outbound “helpful” or official tourism / transit / park links are provided as starting points only; schedules, fees, and policies on those sites can change without notice on this Site.</li>
</ul>
<p>You assume full responsibility for decisions you make based on the Site. We are not liable for losses arising from reliance on Site content.</p>`
        },
        {
          id: 'acceptable-use',
          title: 'Acceptable use',
          html: `<p>You agree not to:</p>
<ul>
<li>Use the Site for any unlawful purpose or in violation of these Terms;</li>
<li>Attempt to gain unauthorized access to systems, accounts, or networks related to the Site;</li>
<li>Probe, scan, or stress-test the Site in a way that degrades service for others;</li>
<li>Scrape or bulk-download the Site in a manner that imposes unreasonable load or circumvents access controls, except as allowed by robots rules or an open license;</li>
<li>Misrepresent affiliation with the Site or its author; or</li>
<li>Use content in a way that infringes intellectual property or privacy rights of others.</li>
</ul>`
        },
        {
          id: 'third-party',
          title: 'Third-party links & tools',
          html: `<p>The Site may link to third-party websites or call third-party APIs (for example exchange rates or font delivery). Those services are not under our control.</p>
<ul>
<li><strong>Destination and travel links.</strong> City and destination cards may include “Helpful links” to official tourism sites, transit agencies, National Park Service pages, museums, and similar external resources. These links are provided solely for convenience and planning reference. They do <strong>not</strong> create a partnership, sponsorship, agency, or endorsement relationship with any linked organization unless we expressly say so in writing.</li>
<li><strong>No control or warranty.</strong> We do not operate, monitor, or guarantee the accuracy, safety, availability, or privacy practices of third-party sites or APIs. Content, URLs, branding, and policies on those sites may change or break without notice.</li>
<li><strong>Your responsibility.</strong> When you leave the Site via an external link, you do so at your own risk and become subject to that third party’s terms and privacy policy. Verify critical travel, booking, or payment details directly with the official source.</li>
</ul>
<p>If a third-party link is broken, outdated, or inappropriate, you may contact us so we can consider an update; we are not obligated to maintain any particular external URL.</p>`
        },
        {
          id: 'privacy',
          title: 'Privacy',
          html: `<p>Our <a href="privacy.html">Privacy Policy</a> explains how the Site handles information. It is incorporated into these Terms by reference. By using the Site, you also acknowledge that internet transmissions are never completely private or secure.</p>`
        },
        {
          id: 'disclaimers',
          title: 'Disclaimers',
          html: `<p>THE SITE AND ALL CONTENT ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS, OR THAT ANY DEFECTS WILL BE CORRECTED.</p>
<p>Information on the Site may change without notice. We have no obligation to update any particular page or tool.</p>`
        },
        {
          id: 'liability',
          title: 'Limitation of liability',
          html: `<p>To the fullest extent permitted by law, Tim G / TGthms and contributors to the Site will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising out of or related to your use of (or inability to use) the Site—even if advised of the possibility of such damages.</p>`
        },
        {
          id: 'changes',
          title: 'Changes to the Site',
          html: `<p>We may modify, suspend, or discontinue any part of the Site at any time without notice, including for maintenance, redesign, or project direction. We are not obligated to continue hosting any particular feature or photo.</p>`
        },
        {
          id: 'contact',
          title: 'Contact',
          html: `<p>Questions about these Terms, photo licensing, or permissions:</p>
<ul>
<li><a href="mailto:contact.timg@icloud.com">contact.timg@icloud.com</a></li>
<li><a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">GitHub repository</a></li>
</ul>
<p class="legal-note">These Terms are written for a personal travel-guide project and are not a substitute for legal advice.</p>`
        }
      ],
      footerNote: '© 2026 USA Travel Guide · Tim G (TGthms). All rights reserved except where open licenses apply.'
    },
    es: {
      title: 'Términos de uso',
      eyebrow: 'Legal',
      updatedLabel: 'Actualización',
      updatedDate: '11 de julio de 2026',
      onThisPage: 'En esta página',
      lead: 'Estos Términos de uso (“Términos”) regulan el acceso y el uso de <strong>América — Una Guía de Viaje</strong> (el “Sitio”), incluida la guía principal, la galería de fotos, las herramientas y las páginas relacionadas, operados por <strong>Tim G</strong> (GitHub <a href="https://github.com/TGthms" target="_blank" rel="noopener">@TGthms</a>). Al utilizar el Sitio, aceptas estos Términos. Si no estás de acuerdo, te pedimos que no lo uses.',
      toc: [
        { id: 'agreement', label: 'Aceptación de los términos' },
        { id: 'ownership', label: 'Titularidad del Sitio' },
        { id: 'photos', label: 'Fotografías y contenido visual' },
        { id: 'software', label: 'Software y código' },
        { id: 'travel', label: 'Información de viaje' },
        { id: 'acceptable-use', label: 'Uso permitido' },
        { id: 'third-party', label: 'Enlaces y herramientas de terceros' },
        { id: 'privacy', label: 'Privacidad' },
        { id: 'disclaimers', label: 'Exención de garantías' },
        { id: 'liability', label: 'Limitación de responsabilidad' },
        { id: 'changes', label: 'Cambios en el Sitio' },
        { id: 'contact', label: 'Contacto' }
      ],
      sections: [
        {
          id: 'agreement',
          title: 'Aceptación de los términos',
          html: `<p>Estos Términos se aplican al Sitio tal como se ofrece en línea (incluido cualquier espejo o alojamiento estático del proyecto). Podemos actualizarlos publicando una versión revisada en esta página y actualizando la fecha que figura arriba. Si sigues usando el Sitio después de un cambio, aceptas los Términos revisados.</p>
<p>Mientras cumplas estos Términos, te concedemos un derecho personal, no exclusivo, intransferible y limitado para acceder y usar el Sitio con fines personales y no comerciales.</p>`
        },
        {
          id: 'ownership',
          title: 'Titularidad del Sitio',
          html: `<p>El Sitio —incluido su texto, diseño, interfaz, logotipos, gráficos, la selección y disposición de contenidos, y el material editorial original— es propiedad de Tim G / TGthms o se usa bajo licencia, y está protegido por derechos de autor y otras normas de propiedad intelectual.</p>
<p>Salvo lo que estos Términos permitan de forma expresa, o lo que indique una licencia abierta para un componente concreto, no puedes copiar, reproducir, republicar, cargar, publicar, exhibir en público, codificar, traducir, transmitir ni distribuir ninguna parte del Sitio con fines comerciales sin nuestro permiso previo por escrito.</p>`
        },
        {
          id: 'photos',
          title: 'Fotografías y contenido visual',
          html: `<p>Las fotografías y obras visuales de la galería y del resto del Sitio (incluidos los archivos en <code>images/</code>) son <strong>© 2026 Tim G (GitHub @TGthms)</strong>, salvo que una obra concreta indique otro crédito.</p>
<p>Esas fotografías se ponen a disposición bajo la licencia <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">Creative Commons Atribución 4.0 Internacional (CC BY 4.0)</a>. En pocas palabras, puedes compartir y adaptar las fotos —también con fines comerciales— si:</p>
<ul>
<li>das el crédito adecuado a <strong>Tim G / @TGthms</strong>;</li>
<li>incluyes un enlace a la licencia CC BY 4.0 cuando sea razonable;</li>
<li>indicas si se hicieron cambios; y</li>
<li>no das a entender que el autor te respalda a ti ni a tu uso.</li>
</ul>
<p>Atribución sugerida: <em>“Foto © Tim G (@TGthms), con licencia CC BY 4.0.”</em></p>
<p>No está permitido eliminar marcas de agua, atribuir la autoría de forma falsa ni usar las fotos de un modo que infrinja la ley aplicable. Si necesitas derechos más amplios que CC BY 4.0, contáctanos.</p>`
        },
        {
          id: 'software',
          title: 'Software y código',
          html: `<p>El código fuente del proyecto puede publicarse bajo una licencia de código abierto (por ejemplo, la <a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">licencia MIT</a> del repositorio). Esa licencia rige el software; <strong>no</strong> sitúa automáticamente las fotografías bajo la misma licencia. Los derechos de las fotos son los descritos en el apartado anterior, salvo que el aviso de un archivo concreto diga otra cosa.</p>`
        },
        {
          id: 'travel',
          title: 'Información de viaje',
          html: `<p>El contenido del Sitio —destinos, estaciones, rutas, consejos, notas sobre visados, costes, herramientas e información práctica— se ofrece solo con fines <strong>informativos y educativos generales</strong>. No constituye asesoramiento profesional de carácter legal, migratorio, médico, financiero ni de seguridad.</p>
<ul>
<li>Las normas de viaje, los precios, los horarios, el estado de las carreteras y los requisitos cambian con frecuencia.</li>
<li>Antes de viajar, comprueba siempre los datos importantes en fuentes oficiales, con las compañías de transporte y con las autoridades locales.</li>
<li>Las herramientas interactivas (divisas, propina, coste de desplazamiento, relojes) ofrecen solo estimaciones y pueden estar incompletas o desactualizadas.</li>
<li>Los enlaces “útiles” o a sitios oficiales de turismo, transporte o parques son solo un punto de partida; horarios, tarifas y políticas en esos sitios pueden cambiar sin que este Sitio lo refleje de inmediato.</li>
</ul>
<p>Eres responsable de las decisiones que tomes basándote en el Sitio. No respondemos por pérdidas derivadas de confiar en su contenido.</p>`
        },
        {
          id: 'acceptable-use',
          title: 'Uso permitido',
          html: `<p>Te comprometes a no:</p>
<ul>
<li>usar el Sitio con fines ilícitos o de forma contraria a estos Términos;</li>
<li>intentar acceder sin autorización a sistemas, cuentas o redes relacionados con el Sitio;</li>
<li>sondear, escanear o someter el Sitio a pruebas de carga de un modo que perjudique el servicio para otras personas;</li>
<li>extraer o descargar el Sitio de forma masiva imponiendo una carga irrazonable o eludiendo controles de acceso, salvo lo permitido por las reglas de robots o por una licencia abierta;</li>
<li>afirmar una relación falsa con el Sitio o con su autor; ni</li>
<li>usar el contenido de forma que vulnere derechos de propiedad intelectual o de privacidad de terceros.</li>
</ul>`
        },
        {
          id: 'third-party',
          title: 'Enlaces y herramientas de terceros',
          html: `<p>El Sitio puede enlazar a sitios de terceros o invocar API de terceros (por ejemplo, tipos de cambio o entrega de fuentes). Esos servicios no están bajo nuestro control.</p>
<ul>
<li><strong>Enlaces de destinos y viaje.</strong> Las fichas de ciudades y destinos pueden incluir “Enlaces útiles” a sitios oficiales de turismo, transporte, páginas del National Park Service, museos y recursos similares. Se ofrecen solo por comodidad y como referencia de planificación. <strong>No</strong> crean por sí solos una relación de asociación, patrocinio, agencia o respaldo con la organización enlazada, salvo que lo indiquemos por escrito.</li>
<li><strong>Sin control ni garantía.</strong> No operamos, supervisamos ni garantizamos la exactitud, seguridad, disponibilidad o prácticas de privacidad de sitios o API de terceros. Su contenido, URL, marca y políticas pueden cambiar o dejar de funcionar sin previo aviso.</li>
<li><strong>Tu responsabilidad.</strong> Cuando abandonas el Sitio por un enlace externo, lo haces bajo tu propio riesgo y quedan aplicables los términos y la política de privacidad de ese tercero. Verifica los datos críticos de viaje, reservas o pagos directamente en la fuente oficial.</li>
</ul>
<p>Si un enlace está roto, desactualizado o resulta inadecuado, puedes avisarnos para que valoremos una corrección; no estamos obligados a mantener ninguna URL externa concreta.</p>`
        },
        {
          id: 'privacy',
          title: 'Privacidad',
          html: `<p>Nuestra <a href="privacy.html">Política de privacidad</a> describe cómo el Sitio trata la información y se incorpora a estos Términos por referencia. Al usar el Sitio, también reconoces que las transmisiones por internet nunca son del todo privadas ni seguras.</p>`
        },
        {
          id: 'disclaimers',
          title: 'Exención de garantías',
          html: `<p>EL SITIO Y TODO SU CONTENIDO SE OFRECEN “TAL CUAL” Y “SEGÚN DISPONIBILIDAD”. EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, RENUNCIAMOS A TODAS LAS GARANTÍAS, EXPRESAS O IMPLÍCITAS, INCLUIDAS LAS DE COMERCIABILIDAD, IDONEIDAD PARA UN FIN PARTICULAR, TITULARIDAD Y NO INFRACCIÓN. NO GARANTIZAMOS QUE EL SITIO SEA ININTERRUMPIDO, ESTÉ LIBRE DE ERRORES O DE COMPONENTES DAÑINOS, NI QUE SE CORRIJAN LOS DEFECTOS.</p>
<p>La información del Sitio puede cambiar sin previo aviso. No tenemos la obligación de actualizar ninguna página o herramienta en concreto.</p>`
        },
        {
          id: 'liability',
          title: 'Limitación de responsabilidad',
          html: `<p>En la máxima medida permitida por la ley, Tim G / TGthms y quienes contribuyan al Sitio no responderán por daños indirectos, incidentales, especiales, consecuentes o punitivos, ni por pérdida de beneficios, datos o clientela, derivados del uso del Sitio o de la imposibilidad de usarlo, incluso si se advirtió de la posibilidad de tales daños.</p>`
        },
        {
          id: 'changes',
          title: 'Cambios en el Sitio',
          html: `<p>Podemos modificar, suspender o dejar de ofrecer cualquier parte del Sitio en cualquier momento y sin previo aviso —por mantenimiento, rediseño o evolución del proyecto—. No estamos obligados a seguir alojando una función o una fotografía concretas.</p>`
        },
        {
          id: 'contact',
          title: 'Contacto',
          html: `<p>Para preguntas sobre estos Términos, la licencia de las fotos o permisos adicionales:</p>
<ul>
<li><a href="mailto:contact.timg@icloud.com">contact.timg@icloud.com</a></li>
<li><a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">Repositorio en GitHub</a></li>
</ul>
<p class="legal-note">Estos Términos se redactan para un proyecto personal de guía de viaje y no sustituyen el asesoramiento jurídico.</p>`
        }
      ],
      footerNote: '© 2026 USA Travel Guide · Tim G (TGthms). Todos los derechos reservados, salvo donde se indiquen licencias abiertas.'
    },
    zh: {
      title: '使用条款',
      eyebrow: '法律信息',
      updatedLabel: '更新日期',
      updatedDate: '2026年7月11日',
      onThisPage: '本页内容',
      lead: '本《使用条款》（以下简称“本条款”）规范你对<strong>美国 — 旅行指南</strong>（以下简称“本网站”）的访问与使用，包括主指南、相册、工具及相关页面。本网站由 <strong>Tim G</strong>（GitHub <a href="https://github.com/TGthms" target="_blank" rel="noopener">@TGthms</a>）运营。使用本网站，即表示你同意本条款。若不同意，请勿使用本网站。',
      toc: [
        { id: 'agreement', label: '接受条款' },
        { id: 'ownership', label: '网站权利归属' },
        { id: 'photos', label: '照片与视觉内容' },
        { id: 'software', label: '软件与代码' },
        { id: 'travel', label: '旅行信息说明' },
        { id: 'acceptable-use', label: '使用规范' },
        { id: 'third-party', label: '第三方链接与工具' },
        { id: 'privacy', label: '隐私' },
        { id: 'disclaimers', label: '免责声明' },
        { id: 'liability', label: '责任限制' },
        { id: 'changes', label: '网站变更' },
        { id: 'contact', label: '联系我们' }
      ],
      sections: [
        {
          id: 'agreement',
          title: '接受条款',
          html: `<p>本条款适用于在线提供的本网站（包括项目的镜像站点或静态托管版本）。我们可能通过在本页发布修订版本并更新上述日期的方式更新本条款。更新后如你继续使用本网站，即表示你接受修订后的条款。</p>
<p>在你遵守本条款的前提下，我们授予你一项个人、非独占、不可转让的有限权利，仅可出于个人、非商业目的访问和使用本网站。</p>`
        },
        {
          id: 'ownership',
          title: '网站权利归属',
          html: `<p>本网站（包括文字、版式、设计、界面、标识、图形、内容编排，以及原创编辑内容）归 Tim G / TGthms 所有，或经合法许可使用，并受著作权及其他知识产权法律保护。</p>
<p>除非本条款明确允许，或某组件另有开放许可说明，否则未经事先书面许可，你不得为商业目的复制、转载、上传、发布、公开展示、编码、翻译、传输或分发本网站的任何部分。</p>`
        },
        {
          id: 'photos',
          title: '照片与视觉内容',
          html: `<p>相册及本网站其他位置的照片与相关视觉作品（包括 <code>images/</code> 目录下的文件）版权归 <strong>© 2026 Tim G（GitHub @TGthms）</strong>，除非某幅作品另有署名说明。</p>
<p>上述照片依据 <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">知识共享“署名”4.0 国际许可协议（CC BY 4.0）</a> 提供。简要而言，你可以分享与修改这些照片（包括用于商业用途），但须：</p>
<ul>
<li>向 <strong>Tim G / @TGthms</strong> 给予适当署名；</li>
<li>在可行时提供 CC BY 4.0 许可协议链接；</li>
<li>说明是否进行了修改；以及</li>
<li>不得暗示作者认可你或你的使用方式。</li>
</ul>
<p>建议署名：<em>“照片 © Tim G (@TGthms)，采用 CC BY 4.0 许可。”</em></p>
<p>不得去除水印、进行虚假署名，或以违反适用法律的方式使用照片。若你需要超出 CC BY 4.0 范围的权利，请与我们联系。</p>`
        },
        {
          id: 'software',
          title: '软件与代码',
          html: `<p>本网站项目的源代码可能以开源许可发布（例如仓库中的 <a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">MIT 许可</a>）。开源许可仅适用于软件本身，<strong>不会</strong>自动使照片适用同一许可。除非某个文件另有说明，照片权利仍以上一节为准。</p>`
        },
        {
          id: 'travel',
          title: '旅行信息说明',
          html: `<p>本网站内容（包括目的地、季节、路线、贴士、签证相关说明、费用、工具与实用信息）仅供<strong>一般性信息与教育用途</strong>，不构成专业法律、移民、医疗、财务或安全建议。</p>
<ul>
<li>旅行规定、价格、开放时间、路况与入境要求等经常变化。</li>
<li>出行前，请务必向政府官方来源、承运人与地方当局核实关键信息。</li>
<li>互动工具（货币、小费、自驾费用、时钟）仅提供估算，可能不完整或已过时。</li>
<li>“实用链接”或指向官方旅游／交通／公园网站的外链仅供参考起点；那些网站上的时刻、费用与政策可能随时变更，本网站未必同步更新。</li>
</ul>
<p>你须对依据本网站所作决定自行承担责任。我们不对因依赖本网站内容而产生的损失负责。</p>`
        },
        {
          id: 'acceptable-use',
          title: '使用规范',
          html: `<p>你同意不得：</p>
<ul>
<li>将本网站用于任何非法目的，或以违反本条款的方式使用本网站；</li>
<li>试图未经授权访问与本网站相关的系统、账户或网络；</li>
<li>以影响他人正常使用的方式对本网站进行探测、扫描或压力测试；</li>
<li>以造成不合理负载或规避访问控制的方式抓取或批量下载本网站（robots 规则或开放许可明确允许的除外）；</li>
<li>虚假声称与本网站或其作者存在关联；或</li>
<li>以侵犯他人知识产权或隐私权的方式使用内容。</li>
</ul>`
        },
        {
          id: 'third-party',
          title: '第三方链接与工具',
          html: `<p>本网站可能链接第三方网站，或调用第三方接口（例如汇率查询、字体加载）。这些服务不在我们的控制范围内。</p>
<ul>
<li><strong>目的地与旅行相关链接。</strong>城市与目的地卡片可能提供指向官方旅游网站、公共交通机构、国家公园管理局页面、博物馆等的“实用链接”。其目的仅为便利与规划参考。除非我们另有书面说明，此类链接<strong>并不</strong>表示我们与被链接机构存在合伙、赞助、代理或背书关系。</li>
<li><strong>无控制与无保证。</strong>我们不运营、不监控，也不保证第三方网站或接口的准确性、安全性、可用性或其隐私实践。其内容、链接地址、品牌与政策可能不经通知而变更或失效。</li>
<li><strong>你的责任。</strong>通过外链离开本网站时，风险由你自行承担，并适用该第三方的条款与隐私政策。请直接向官方来源核实关键旅行、预订或支付信息。</li>
</ul>
<p>若你发现第三方链接失效、过时或不适当，欢迎告知我们，我们会考虑更新；但我们无义务维持任何特定外部链接长期有效。</p>`
        },
        {
          id: 'privacy',
          title: '隐私',
          html: `<p>我们的<a href="privacy.html">隐私政策</a>说明本网站如何处理信息，并构成本条款的一部分。使用本网站，即表示你亦知悉：互联网传输并非完全私密或绝对安全。</p>`
        },
        {
          id: 'disclaimers',
          title: '免责声明',
          html: `<p>本网站及全部内容按“现状”和“可供使用”的基础提供。在法律允许的最大范围内，我们不作任何明示或默示保证，包括适销性、特定用途适用性、权属及不侵权。我们不保证本网站不会中断、没有错误、不含有害成分，也不保证缺陷一定会被修复。</p>
<p>本网站信息可能不经通知而变更。我们没有义务更新任何特定页面或工具。</p>`
        },
        {
          id: 'liability',
          title: '责任限制',
          html: `<p>在法律允许的最大范围内，Tim G / TGthms 及本网站贡献者，不对因你使用（或无法使用）本网站而产生的任何间接、附带、特殊、后果性或惩罚性损害，或利润、数据、商誉损失承担责任——即使已被告知可能发生此类损害。</p>`
        },
        {
          id: 'changes',
          title: '网站变更',
          html: `<p>我们可随时不经通知修改、暂停或终止本网站的任何部分，包括出于维护、改版或项目安排的需要。我们没有义务持续提供任何特定功能或照片。</p>`
        },
        {
          id: 'contact',
          title: '联系我们',
          html: `<p>如对本条款、照片许可或额外授权有疑问，请联系：</p>
<ul>
<li><a href="mailto:contact.timg@icloud.com">contact.timg@icloud.com</a></li>
<li><a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">GitHub 仓库</a></li>
</ul>
<p class="legal-note">本条款为个人旅行指南项目而撰写，不能替代法律意见。</p>`
        }
      ],
      footerNote: '© 2026 USA Travel Guide · Tim G (TGthms)。除适用开放许可的部分外，保留所有权利。'
    },
    ja: {
      title: '利用規約',
      eyebrow: 'リーガル',
      updatedLabel: '更新日',
      updatedDate: '2026年7月11日',
      onThisPage: 'このページの内容',
      lead: '本利用規約（以下「本規約」）は、<strong>アメリカ — 旅行ガイド</strong>（以下「本サイト」）へのアクセスおよびご利用（メインガイド、フォトギャラリー、ツールおよび関連ページを含みます）について定めるものです。本サイトは <strong>Tim G</strong>（GitHub <a href="https://github.com/TGthms" target="_blank" rel="noopener">@TGthms</a>）が運営しています。本サイトをご利用いただくことにより、本規約に同意したものとみなします。同意いただけない場合は、ご利用をお控えください。',
      toc: [
        { id: 'agreement', label: '規約への同意' },
        { id: 'ownership', label: '本サイトの権利' },
        { id: 'photos', label: '写真・ビジュアル' },
        { id: 'software', label: 'ソフトウェアとコード' },
        { id: 'travel', label: '旅行情報について' },
        { id: 'acceptable-use', label: '禁止事項' },
        { id: 'third-party', label: '第三者リンクとツール' },
        { id: 'privacy', label: 'プライバシー' },
        { id: 'disclaimers', label: '免責事項' },
        { id: 'liability', label: '責任の制限' },
        { id: 'changes', label: '本サイトの変更' },
        { id: 'contact', label: 'お問い合わせ' }
      ],
      sections: [
        {
          id: 'agreement',
          title: '規約への同意',
          html: `<p>本規約は、オンラインで提供される本サイト（プロジェクトのミラーや静的ホスティングを含みます）に適用されます。当方は、本ページに改訂版を掲載し、上記の日付を更新することにより、本規約を随時更新できます。変更後も本サイトを継続してご利用いただく場合、改訂後の規約に同意したものとみなします。</p>
<p>本規約を遵守していただける限り、個人的かつ非商業的な目的で本サイトにアクセスし利用するための、個人的・非独占的・譲渡不能・限定的な権利を付与します。</p>`
        },
        {
          id: 'ownership',
          title: '本サイトの権利',
          html: `<p>本サイト（テキスト、レイアウト、デザイン、ユーザーインターフェース、ロゴ、グラフィック、コンテンツの編集・構成、オリジナルの編集素材を含みます）は、Tim G / TGthms が所有するか、ライセンスに基づき使用しており、著作権その他の知的財産法により保護されています。</p>
<p>本規約で明示的に許されている場合、または特定の構成要素について示されたオープンライセンスがある場合を除き、事前の書面による許可なく、商業目的で本サイトの一部を複製、再公開、アップロード、掲示、公に表示、符号化、翻訳、送信、配布してはなりません。</p>`
        },
        {
          id: 'photos',
          title: '写真・ビジュアル',
          html: `<p>ギャラリーその他本サイト上の写真および関連するビジュアル作品（<code>images/</code> 配下のファイルを含みます）は、個別に別のクレジットが示されていない限り、<strong>© 2026 Tim G（GitHub @TGthms）</strong> です。</p>
<p>これらの写真は、<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">クリエイティブ・コモンズ 表示 4.0 国際（CC BY 4.0）</a> に基づき提供されます。分かりやすく言うと、次の条件を満たせば、写真の共有や翻案（商用利用を含む）が可能です。</p>
<ul>
<li><strong>Tim G / @TGthms</strong> に適切なクレジットを付すこと</li>
<li>実務上可能な場合は CC BY 4.0 へのリンクを示すこと</li>
<li>変更を加えた場合はその旨を示すこと</li>
<li>著者があなたやあなたの利用を推奨していると示唆しないこと</li>
</ul>
<p>推奨クレジット例：<em>「Photo © Tim G (@TGthms), licensed under CC BY 4.0.」</em></p>
<p>透かしの除去、虚偽の帰属表示、適用法に違反する利用は禁止されています。CC BY 4.0 を超える権利が必要な場合は、ご連絡ください。</p>`
        },
        {
          id: 'software',
          title: 'ソフトウェアとコード',
          html: `<p>本サイトプロジェクトのソースコードは、オープンソースライセンス（例：リポジトリに付属する <a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">MIT ライセンス</a>）で公開される場合があります。オープンソースライセンスはソフトウェアに適用され、写真を自動的に同じライセンスの対象とするものでは<strong>ありません</strong>。ファイルに別段の表示がない限り、写真の権利は前項のとおりです。</p>`
        },
        {
          id: 'travel',
          title: '旅行情報について',
          html: `<p>本サイトのコンテンツ（目的地、季節、ルート、ヒント、ビザ関連の記載、費用、ツール、実用情報を含みます）は、<strong>一般的な情報提供および教育目的</strong>のみで提供されます。専門の法律・出入国管理・医療・金融・安全に関する助言ではありません。</p>
<ul>
<li>渡航規則、価格、営業時間、道路状況、各種要件は頻繁に変わります。</li>
<li>ご出発前に、政府機関・運送事業者・現地当局の公式情報で重要事項を必ずご確認ください。</li>
<li>インタラクティブなツール（通貨・チップ・移動費用・時計）は概算のみであり、不完全または古い場合があります。</li>
<li>外部の「役立つリンク」や公式観光／交通／公園サイトへのリンクは出発点としてのみ提供します。それらのサイト上の時刻・料金・方針は、本サイトに予告なく変更されることがあります。</li>
</ul>
<p>本サイトに基づくご判断の責任は、すべてお客様にあります。本サイト内容への依拠により生じた損失について、当方は責任を負いません。</p>`
        },
        {
          id: 'acceptable-use',
          title: '禁止事項',
          html: `<p>お客様は、次の行為を行わないことに同意するものとします。</p>
<ul>
<li>違法な目的、または本規約に反する本サイトの利用</li>
<li>本サイトに関連するシステム・アカウント・ネットワークへの不正アクセスの試み</li>
<li>他の利用者の利用を損なうプロービング、スキャン、負荷試験</li>
<li>不合理な負荷を与える、またはアクセス制御を回避するスクレイピング／一括ダウンロード（robots やオープンライセンスで許される場合を除く）</li>
<li>本サイトまたは著者との関係を偽ること</li>
<li>他者の知的財産権またはプライバシーを侵害するコンテンツ利用</li>
</ul>`
        },
        {
          id: 'third-party',
          title: '第三者リンクとツール',
          html: `<p>本サイトは、第三者のウェブサイトへリンクしたり、第三者 API（為替やフォント配信など）を呼び出したりする場合があります。これらは当方の管理下にありません。</p>
<ul>
<li><strong>目的地・旅行関連リンク。</strong>都市・目的地カードには、公式観光サイト、公共交通機関、National Park Service のページ、博物館などへの「役立つリンク」が含まれる場合があります。便宜および計画の参考のためにのみ提供され、書面で明示しない限り、リンク先組織との提携・スポンサーシップ・代理・推奨関係を<strong>意味しません</strong>。</li>
<li><strong>管理・保証なし。</strong>第三者サイトや API の正確性・安全性・可用性・プライバシー慣行について、当方は運営・監視・保証いたしません。内容、URL、ブランド、方針は、予告なく変更または無効になる場合があります。</li>
<li><strong>お客様の責任。</strong>外部リンクにより本サイトを離れる場合は自己責任であり、当該第三者の利用規約およびプライバシーポリシーが適用されます。重要な旅行・予約・お支払いに関する情報は、公式の情報源で直接ご確認ください。</li>
</ul>
<p>第三者リンクが機能していない、古い、または不適切である場合はご連絡ください（更新を検討します）。特定の外部 URL を維持する義務は負いません。</p>`
        },
        {
          id: 'privacy',
          title: 'プライバシー',
          html: `<p>本サイトにおける情報の取り扱いは、<a href="privacy.html">プライバシーポリシー</a> に記載されており、参照により本規約の一部を構成します。本サイトのご利用により、インターネット通信が完全に私的・安全ではないこともご認識いただいたものとみなします。</p>`
        },
        {
          id: 'disclaimers',
          title: '免責事項',
          html: `<p>本サイトおよびすべてのコンテンツは、「現状有姿」かつ「提供可能な範囲」で提供されます。法律で認められる最大限の範囲において、商品性、特定目的適合性、権原、非侵害を含む明示・黙示の保証をすべて否認します。本サイトが中断なく、誤りがなく、有害な要素がなく、欠陥が修正されることを保証するものではありません。</p>
<p>本サイトの情報は予告なく変更される場合があります。特定のページやツールを更新する義務を負いません。</p>`
        },
        {
          id: 'liability',
          title: '責任の制限',
          html: `<p>法律で認められる最大限の範囲において、Tim G / TGthms および本サイトの貢献者は、本サイトの利用（または利用できないこと）に関連して生じた間接的・付随的・特別・結果的・懲罰的損害、または利益・データ・信用の損失について、たとえその可能性を知らされていたとしても、責任を負いません。</p>`
        },
        {
          id: 'changes',
          title: '本サイトの変更',
          html: `<p>当方は、保守、再設計、プロジェクト方針などのため、予告なく本サイトの一部を変更・停止・終了することができます。特定の機能や写真の提供を継続する義務は負いません。</p>`
        },
        {
          id: 'contact',
          title: 'お問い合わせ',
          html: `<p>本規約、写真のライセンス、追加の許諾に関するご質問は、次までご連絡ください。</p>
<ul>
<li><a href="mailto:contact.timg@icloud.com">contact.timg@icloud.com</a></li>
<li><a href="https://github.com/TGthms/usa-travel-guide" target="_blank" rel="noopener">GitHub リポジトリ</a></li>
</ul>
<p class="legal-note">本規約は個人の旅行ガイドプロジェクト向けに作成されたものであり、法的助言に代わるものではありません。</p>`
        }
      ],
      footerNote: '© 2026 USA Travel Guide · Tim G (TGthms)。オープンライセンスが適用される場合を除き、すべての権利を留保します。'
    }
  }
};
