import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'DocHub',
  tagline: '吾生也有涯，而知也无涯!',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://ilcb.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ilcb', // Usually your GitHub org/user name.
  projectName: 'ilcb.github.io', // 仓库名
  deploymentBranch: 'main', // 部署分支
  trailingSlash: false, // 明确关闭结尾斜杠

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    localeConfigs: {
      zh: {
        label: '中文',
      },
      en: {
        label: 'English',
      },
    },
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'DocHub',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      items: [
        /*{
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Tutorial',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/facebook/docusaurus',
          label: 'GitHub',
          position: 'right',
        },*/
        {
          type: 'docSidebar',
          // 确保这里的ID与您的sidebar.js中某个文档的ID匹配
          position: 'left',
          label: '后端',
          sidebarId: 'backendSideBar',
        },
        {
          type: 'dropdown',
          label: 'Wiki',
          position: 'left',
          items: [
            {
              type: 'docSidebar',
              label: '算法',
              sidebarId: 'algorithmSidebar',
            },
            {
              type: 'docSidebar',
              label: '设计模式',
              sidebarId: 'designPatternSidebar',
            },
            {
              type: 'docSidebar',
              label: 'UML',
              sidebarId: 'umlSidebar',
            },
          ],
        },
        {
          type: 'dropdown',
          label: '云原生',
          position: 'left',
          items: [
            {
              type: 'docSidebar',
              label: '容器',
              sidebarId: 'dockerSidebar',
            },
            {
              type: 'docSidebar',
              label: '镜像仓库',
              sidebarId: 'harborSidebar',
            },
            {
              type: 'docSidebar',
              label: '容器编排',
              sidebarId: 'orchestrationSidebar',
            },
            // {
            //   type: 'docSidebar',
            //   label: '设计模式',
            //   sidebarId: 'designPatternSidebar',
            // },
          ],
        },
        {
          type: 'docSidebar',
          // 确保这里的ID与您的sidebar.js中某个文档的ID匹配
          position: 'left',
          label: '工具',
          sidebarId: 'toolsSidebar',
        },

      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: 'docs/Tutorial/React Native跨端开发环境的副本/React Native跨端开发环境',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            // {
            //   label: 'Discord',
            //   href: 'https://discordapp.com/invite/docusaurus',
            // },
            // {
            //   label: 'X',
            //   href: 'https://x.com/docusaurus',
            // },
          ],
        },
        {
          title: 'More',
          items: [
            // {
            //   label: 'Blog',
            //   to: '/blog',
            // },
            {
              label: 'GitHub',
              href: 'https://github.com/ilcb',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} DocHub, Inc. Built with Docusaurus.`,
    },
    tableOfContents: {
      minHeadingLevel: 2, // 从 h1 开始显示
      maxHeadingLevel: 6, // 默认到 h6
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: [
        'java',
        'kotlin',
        'scala',
        'python',
        'go',
        'rust',
        'c',
        'cpp',
        'csharp',
        'swift',
        'bash',
        'sql',
        'json',
        'yaml',
        'toml',
        'ini',
        'docker',
        'git',
        'nginx',
        'graphql',
        'http',
        //'xml',
        'markup',     // HTML 实际对应的是 markup
        'css',
        'scss',
        'less',
        'javascript',
        'typescript',
        'tsx',
        'jsx',
        'php',
        'perl',
        'ruby',
        'regex'
      ]
    },
    algolia: {
      // The application ID provided by Algolia
      appId: 'KH2JHIT03F',

      // Public API key: it is safe to commit it
      apiKey: '54562e49efc08e4f3da778465e2e1129',

      indexName: 'doc_index',

      // Optional: see doc section below
      contextualSearch: true,
    },
    metadata: [
      {
        name: 'algolia-site-verification',
        content: '7AC2C149ACF91D98',
      },
    ],
    // 将大文件转为 Buffer
    webpack: {
      module: {
        rules: [
          {
            test: /\.(txt|json)$/,
            type: 'asset/source', // 使用 Webpack 5 的 Asset Modules
            parser: {
              dataUrlCondition: {
                maxSize: 8 * 1024, // 超过 8KB 自动转为 Buffer
              },
            },
          },
        ],
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
