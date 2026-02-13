import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { CloudScene } from '@/react/three/CloudScene';
import { useReducedMotion } from '@/react/hooks/useReducedMotion';
import { CardSpotlight } from '@/react/ui/CardSpotlight';
import { StaggerContainer, StaggerItem } from '@/react/motion/StaggerContainer';
import { FadeIn } from '@/react/motion/FadeIn';
import { BackgroundBeams } from '@/react/ui/BackgroundBeams';
import { CoverFallbackArtwork } from '@/react/ui/CoverFallbackArtwork';
import { cn } from '@/react/ui/cn';

type TimelineType = 'career' | 'learning' | 'family' | 'health' | 'reflection';
type Impact = 'high' | 'medium' | 'low';

interface HomeStats {
  totalPosts: number;
  totalWords: number;
  totalTags: number;
  activeDays: number;
  byCategory: {
    tech: number;
    learning: number;
    life: number;
  };
}

interface TimelineNode {
  id: string;
  start_date: string;
  end_date?: string;
  title: string;
  type: TimelineType;
  impact: Impact;
  description: string;
}

interface HighlightCard {
  id: string;
  stage: string;
  period: string;
  achievements: string[];
  type: TimelineType;
  impact: Impact;
  cover?: string;
}

interface City {
  name: string;
  period: string;
  tag: '求学' | '工作' | '旅行' | '生活';
  current?: boolean;
}

interface TravelPlace {
  province: string;
  label: string;
  path: string;
  cities: City[];
  marker?: { x: number; y: number; icon?: 'dot' | 'star'; city: string };
}

interface StageNode {
  id: string;
  label: string;
  period: string;
  category: 'learning' | 'career' | 'family';
  x: number;
  y: number;
}

interface FriendNode {
  id: string;
  stageId: string;
  publicLabel: string;
  name: string;
  bio: string;
  link?: string;
}

interface Tooltip {
  x: number;
  y: number;
  province: string;
}

interface SocialTooltip {
  x: number;
  y: number;
  friendId: string;
}

interface HomePageExperienceProps {
  stats: HomeStats;
}

const slogans = [
  '用代码丈量世界的边界',
  '记录即存在，分享即生长',
  '每一次优化都是向自由迈进',
  '在云端看自己的脚印',
  '技术是手段，思考是目的',
  '把日常过成实验，把生活活成作品',
];

const timelineNodes: TimelineNode[] = [
  { id: 'n1', start_date: '2000-09', title: '出生', type: 'family', impact: 'medium', description: '时间线起点。' },
  { id: 'n2', start_date: '2006-09', end_date: '2012-07', title: '凉城三小 · 小学', type: 'learning', impact: 'medium', description: '开始系统接受基础教育。' },
  { id: 'n3', start_date: '2012-09', end_date: '2016-07', title: '扬波中学 · 初中', type: 'learning', impact: 'medium', description: '视野打开，学习方法逐步成型。' },
  { id: 'n4', start_date: '2016-09', end_date: '2019-07', title: '交大附中嘉定分校 · 高中', type: 'learning', impact: 'medium', description: '持续积累，进入高密度训练期。' },
  { id: 'n45', start_date: '2018-12', end_date: '2019-01', title: '暗夜与破晓', type: 'reflection', impact: 'low', description: '高三的漫长冬天，也是黎明前最深的夜。' },
  { id: 'n5', start_date: '2019-09', end_date: '2023-07', title: '同济大学 · 本科', type: 'learning', impact: 'high', description: '学业与组织工作并进，形成工程表达闭环。' },
  { id: 'n6', start_date: '2020-11', title: '和杨彩确定恋爱关系', type: 'family', impact: 'high', description: '人生稳定器与长期同行者。' },
  { id: 'n7', start_date: '2022-11', end_date: '2023-05', title: '蔚来实习', type: 'career', impact: 'medium', description: '第一次深度进入工业级研发流程。' },
  { id: 'n8', start_date: '2024-06', end_date: '2024-09', title: 'SAP 实习', type: 'career', impact: 'medium', description: '跨团队协作与复杂系统实践。' },
  { id: 'n9', start_date: '2024-09', end_date: '2026-03', title: '浙江大学 · 硕士', type: 'learning', impact: 'high', description: '研究与工程并线推进。' },
  { id: 'n10', start_date: '2025-04', end_date: '2025-06', title: '阿里云实习', type: 'career', impact: 'high', description: '大规模云上场景下的工程打磨。' },
  { id: 'n105', start_date: '2025-04', end_date: '2025-10', title: '云层之下', type: 'reflection', impact: 'low', description: '走过一段看不见天空的路，但脚步没有停。' },
  { id: 'n11', start_date: '2026-02', title: '系统整理博客', type: 'career', impact: 'medium', description: '将经验沉淀为可复用的公开资产。' },
];

const highlightCards: HighlightCard[] = [
  {
    id: 'h1',
    stage: '小学 · 初中 · 高中',
    period: '2006-09 → 2019-07',
    achievements: ['三年大队长', '800 米虹口区第二', '1000m 校记录'],
    type: 'learning',
    impact: 'high',
    cover: '/media/highlights/highlight-1.svg',
  },
  {
    id: 'h2',
    stage: '高考',
    period: '2019',
    achievements: ['575 分', '全市 2000 多名'],
    type: 'learning',
    impact: 'high',
    cover: '/media/highlights/highlight-2.svg',
  },
  {
    id: 'h3',
    stage: '同济大学 · 本科',
    period: '2019-09 → 2023-07',
    achievements: ['学生会主席', '优秀毕业生', '优秀毕业论文', '第四、五届进博会志愿者'],
    type: 'learning',
    impact: 'high',
    cover: '/media/highlights/highlight-3.svg',
  },
  {
    id: 'h4',
    stage: '和杨彩确定恋爱关系',
    period: '2020-11',
    achievements: ['长期同行', '稳定支持'],
    type: 'family',
    impact: 'high',
  },
  {
    id: 'h5',
    stage: '浙江大学 · 硕士',
    period: '2024-09 → 2026-03',
    achievements: ['CCF-B 一作', 'CCF-A 二作', '两篇专利', '期刊在投'],
    type: 'learning',
    impact: 'high',
  },
  {
    id: 'h6',
    stage: '阿里云实习',
    period: '2025-04',
    achievements: ['大规模系统实战', '工程质量体系化'],
    type: 'career',
    impact: 'high',
  },
];

const highlightLayout = [
  'col-span-12 lg:col-span-7 lg:translate-y-2',
  'col-span-12 lg:col-span-5 lg:-translate-y-3',
  'col-span-12 lg:col-span-8 lg:translate-y-4',
  'col-span-12 lg:col-span-4 lg:-translate-y-2',
  'col-span-12 lg:col-span-8 lg:-translate-y-2',
  'col-span-12 lg:col-span-4 lg:translate-y-3',
];

const travelPlaces: TravelPlace[] = [
  {
    province: 'shanghai',
    label: '上海',
    path: 'M920 450h20v20H920z',
    cities: [{ name: '上海', period: '2000 → 2024', tag: '生活' }],
    marker: { x: 930, y: 460, icon: 'star', city: '上海' },
  },
  {
    province: 'zhejiang',
    label: '浙江',
    path: 'M840 420h90v90H840z',
    cities: [
      { name: '杭州', period: '2024-09 → 至今', tag: '求学', current: true },
      { name: '宁波', period: '2025-05', tag: '旅行' },
    ],
    marker: { x: 880, y: 465, city: '杭州' },
  },
  {
    province: 'jiangsu',
    label: '江苏',
    path: 'M810 340h110v70H810z',
    cities: [{ name: '南京', period: '2024-10', tag: '旅行' }],
    marker: { x: 855, y: 368, city: '南京' },
  },
  {
    province: 'beijing',
    label: '北京',
    path: 'M760 210h30v20H760z',
    cities: [{ name: '北京', period: '2023', tag: '旅行' }],
    marker: { x: 775, y: 220, city: '北京' },
  },
  {
    province: 'heilongjiang',
    label: '黑龙江',
    path: 'M790 90h140v90H790z',
    cities: [{ name: '哈尔滨', period: '2024', tag: '旅行' }],
    marker: { x: 860, y: 128, city: '哈尔滨' },
  },
  {
    province: 'guangdong',
    label: '广东',
    path: 'M670 560h150v80H670z',
    cities: [{ name: '深圳', period: '2025', tag: '工作' }],
    marker: { x: 748, y: 594, city: '深圳' },
  },
  {
    province: 'fujian',
    label: '福建',
    path: 'M820 510h100v90H820z',
    cities: [{ name: '厦门', period: '2025', tag: '旅行' }],
    marker: { x: 875, y: 548, city: '厦门' },
  },
  {
    province: 'sichuan',
    label: '四川',
    path: 'M360 410h150v130H360z',
    cities: [{ name: '成都', period: '2023', tag: '旅行' }],
    marker: { x: 435, y: 468, city: '成都' },
  },
  {
    province: 'hubei',
    label: '湖北',
    path: 'M560 430h130v90H560z',
    cities: [{ name: '武汉', period: '2024', tag: '旅行' }],
    marker: { x: 620, y: 470, city: '武汉' },
  },
  {
    province: 'inner_mongolia',
    label: '内蒙古',
    path: 'M450 120h340v80H450z',
    cities: [{ name: '呼和浩特', period: '2024', tag: '旅行' }],
    marker: { x: 620, y: 155, city: '呼和浩特' },
  },
  {
    province: 'hainan',
    label: '海南',
    path: 'M690 660h90v30H690z',
    cities: [{ name: '海口', period: '2025', tag: '旅行' }],
    marker: { x: 736, y: 676, city: '海口' },
  },
];

const allProvinceShapes = [
  { id: 'xinjiang', label: '新疆', path: 'M100 260h140v100H100z' },
  { id: 'xizang', label: '西藏', path: 'M130 380h190v110H130z' },
  { id: 'qinghai', label: '青海', path: 'M260 250h150v120H260z' },
  { id: 'gansu', label: '甘肃', path: 'M380 220h110v180H380z' },
  { id: 'sichuan', label: '四川', path: 'M360 410h150v130H360z' },
  { id: 'yunnan', label: '云南', path: 'M300 540h130v90H300z' },
  { id: 'guizhou', label: '贵州', path: 'M450 540h110v80H450z' },
  { id: 'guangxi', label: '广西', path: 'M560 560h110v80H560z' },
  { id: 'guangdong', label: '广东', path: 'M670 560h150v80H670z' },
  { id: 'hainan', label: '海南', path: 'M690 660h90v30H690z' },
  { id: 'hubei', label: '湖北', path: 'M560 430h130v90H560z' },
  { id: 'hunan', label: '湖南', path: 'M560 520h130v80H560z' },
  { id: 'henan', label: '河南', path: 'M560 330h130v90H560z' },
  { id: 'shanxi', label: '山西', path: 'M560 230h120v90H560z' },
  { id: 'hebei', label: '河北', path: 'M690 220h130v100H690z' },
  { id: 'shandong', label: '山东', path: 'M810 240h110v90H810z' },
  { id: 'jiangsu', label: '江苏', path: 'M810 340h110v70H810z' },
  { id: 'zhejiang', label: '浙江', path: 'M840 420h90v90H840z' },
  { id: 'anhui', label: '安徽', path: 'M720 340h90v90H720z' },
  { id: 'fujian', label: '福建', path: 'M820 510h100v90H820z' },
  { id: 'jiangxi', label: '江西', path: 'M720 460h110v100H720z' },
  { id: 'beijing', label: '北京', path: 'M760 210h30v20H760z' },
  { id: 'shanghai', label: '上海', path: 'M920 450h20v20H920z' },
  { id: 'inner_mongolia', label: '内蒙古', path: 'M450 120h340v80H450z' },
  { id: 'heilongjiang', label: '黑龙江', path: 'M790 90h140v90H790z' },
];

const stageNodes: StageNode[] = [
  { id: 'primary', label: '小学', period: '2006-2012', category: 'learning', x: 150, y: 200 },
  { id: 'middle', label: '初中', period: '2012-2016', category: 'learning', x: 310, y: 200 },
  { id: 'high', label: '高中', period: '2016-2019', category: 'learning', x: 470, y: 245 },
  { id: 'tongji', label: '同济', period: '2019-2023', category: 'learning', x: 650, y: 220 },
  { id: 'zju', label: '浙大', period: '2024-2026', category: 'learning', x: 790, y: 290 },
  { id: 'work', label: '工作', period: '2022-Now', category: 'career', x: 900, y: 210 },
];

const friendNodes: FriendNode[] = [
  { id: 'f1', stageId: 'primary', publicLabel: '一位同窗', name: 'L', bio: '童年跑步搭子' },
  { id: 'f2', stageId: 'primary', publicLabel: '一位挚友', name: 'Z', bio: '最早的同桌' },
  { id: 'f3', stageId: 'middle', publicLabel: '一位同窗', name: 'J', bio: '竞赛互助伙伴' },
  { id: 'f4', stageId: 'middle', publicLabel: '一位战友', name: 'Q', bio: '篮球队队友' },
  { id: 'f5', stageId: 'high', publicLabel: '一位同窗', name: 'Y', bio: '高三并肩冲刺' },
  { id: 'f6', stageId: 'high', publicLabel: '一位挚友', name: 'C', bio: '一路陪跑的人' },
  { id: 'f7', stageId: 'tongji', publicLabel: '一位挚友', name: 'M', bio: '本科室友', link: 'https://example.com' },
  { id: 'f8', stageId: 'tongji', publicLabel: '一位战友', name: 'K', bio: '项目并肩开发', link: 'https://example.com' },
  { id: 'f9', stageId: 'tongji', publicLabel: '一位同窗', name: 'S', bio: '学生会伙伴' },
  { id: 'f10', stageId: 'zju', publicLabel: '一位同窗', name: 'W', bio: '论文合作同学' },
  { id: 'f11', stageId: 'zju', publicLabel: '一位战友', name: 'H', bio: '实验室搭档' },
  { id: 'f12', stageId: 'work', publicLabel: '一位战友', name: 'T', bio: '实习期间导师' },
  { id: 'f13', stageId: 'work', publicLabel: '一位同事', name: 'R', bio: '云上平台协作' },
  { id: 'f14', stageId: 'work', publicLabel: '一位朋友', name: 'P', bio: '跨团队合作伙伴' },
];

const dividerVariants = {
  cloud: {
    bg: 'from-[#f8f9fc] via-[#edf1ff] to-[#f8f9fc] dark:from-[#101526] dark:via-[#121a2f] dark:to-[#0f1424]',
    path: 'M0 60 C 120 28, 220 28, 340 62 C 420 82, 530 82, 620 60 C 740 30, 840 32, 960 62 C 1040 82, 1140 82, 1220 62 C 1320 35, 1400 35, 1440 48 L 1440 100 L 0 100 Z',
    fill: '#DFE7FF',
    darkFill: '#1D2742',
  },
  wave: {
    bg: 'from-[#f8f9fc] via-[#f2f6ff] to-[#f8f9fc] dark:from-[#0f1424] dark:via-[#121a2f] dark:to-[#101526]',
    path: 'M0 58 C 140 28, 280 88, 420 58 C 560 28, 700 88, 840 58 C 980 28, 1120 88, 1260 58 C 1340 40, 1400 44, 1440 58 L1440 100 L0 100 Z',
    fill: '#CBD7FF',
    darkFill: '#202A48',
  },
  tide: {
    bg: 'from-[#f8f9fc] via-[#f0f4ff] to-[#f8f9fc] dark:from-[#0f1424] dark:via-[#11192d] dark:to-[#0f1424]',
    path: 'M0 64 L120 54 L240 42 L360 55 L480 74 L600 82 L720 68 L840 46 L960 39 L1080 52 L1200 75 L1320 82 L1440 70 L1440 100 L0 100 Z',
    fill: '#C2D0FF',
    darkFill: '#1E2844',
  },
  ridge: {
    bg: 'from-[#f8f9fc] via-[#eff3ff] to-[#f8f9fc] dark:from-[#101526] dark:via-[#11182d] dark:to-[#101526]',
    path: 'M0 78 L92 32 L185 78 L290 30 L384 78 L500 36 L622 78 L720 32 L840 78 L970 28 L1096 78 L1220 40 L1346 78 L1440 62 L1440 100 L0 100 Z',
    fill: '#D6DEFF',
    darkFill: '#232F4F',
  },
  dust: {
    bg: 'from-[#f8f9fc] via-[#f3f6ff] to-[#f8f9fc] dark:from-[#0f1424] dark:via-[#101729] dark:to-[#0f1424]',
    path: 'M0 72 C 200 60, 420 84, 620 72 C 780 62, 930 86, 1090 72 C 1230 60, 1340 74, 1440 66 L1440 100 L0 100 Z',
    fill: '#E4E9FF',
    darkFill: '#202C4A',
  },
  flow: {
    bg: 'from-[#f8f9fc] via-[#f0f4ff] to-[#f8f9fc] dark:from-[#0f1424] dark:via-[#11192f] dark:to-[#0f1424]',
    path: 'M0 70 C 85 45, 160 95, 250 70 C 345 42, 420 95, 525 70 C 635 44, 710 96, 818 70 C 930 42, 1005 96, 1120 70 C 1232 44, 1304 93, 1440 66 L1440 100 L0 100 Z',
    fill: '#D8E0FF',
    darkFill: '#202D4B',
  },
};

type DividerVariant = keyof typeof dividerVariants;

const typeToneMap: Record<TimelineType, string> = {
  career: 'text-primary-500 border-primary-300 bg-primary-50/70 dark:bg-primary-900/25 dark:border-primary-700/60',
  learning: 'text-sage-600 border-sage-300 bg-sage-50/70 dark:bg-sage-900/25 dark:border-sage-700/60',
  family: 'text-mauve-600 border-mauve-300 bg-mauve-50/70 dark:bg-mauve-900/25 dark:border-mauve-700/60',
  health: 'text-amber-600 border-amber-300 bg-amber-50/70 dark:bg-amber-900/25 dark:border-amber-700/60',
  reflection: 'text-ink-500 border-ink-300 bg-ink-100/60 dark:bg-ink-800/35 dark:border-ink-700/70',
};

const socialCategoryFill: Record<StageNode['category'], string> = {
  learning: '#6B917B',
  career: '#4F6AE5',
  family: '#9684A8',
};

const dateBase = new Date('2000-09-01').getTime();
const dateNow = new Date().getTime();

function monthDistance(date: string) {
  const [y, m] = date.split('-').map((n) => Number(n));
  return y * 12 + (m - 1);
}

function getTypeLabel(type: TimelineType) {
  if (type === 'career') return '职业';
  if (type === 'learning') return '求学';
  if (type === 'family') return '家庭';
  if (type === 'health') return '健康';
  return '沉淀';
}

function typeIconPath(type: TimelineType) {
  if (type === 'career') return '/icons/timeline/career.svg';
  if (type === 'learning') return '/icons/timeline/learning.svg';
  if (type === 'family') return '/icons/timeline/family.svg';
  if (type === 'health') return '/icons/timeline/health.svg';
  return '/icons/timeline/reflection.svg';
}

function categoryBadge(type: TimelineType) {
  if (type === 'career') return 'border-primary-200/80 bg-primary-50/70 text-primary-600 dark:border-primary-700/60 dark:bg-primary-900/25 dark:text-primary-200';
  if (type === 'learning') return 'border-sage-200/80 bg-sage-50/70 text-sage-700 dark:border-sage-700/60 dark:bg-sage-900/25 dark:text-sage-200';
  if (type === 'family') return 'border-mauve-200/80 bg-mauve-50/70 text-mauve-700 dark:border-mauve-700/60 dark:bg-mauve-900/25 dark:text-mauve-200';
  if (type === 'health') return 'border-amber-200/80 bg-amber-50/70 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/25 dark:text-amber-200';
  return 'border-ink-200/80 bg-ink-50/80 text-ink-600 dark:border-ink-700/60 dark:bg-ink-800/30 dark:text-ink-200';
}

function formatShortDate(input: string) {
  const [y, m] = input.split('-');
  return `${y}.${m}`;
}

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString('zh-CN'));

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.3,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [mv, value]);

  return <motion.span>{text}</motion.span>;
}

function SectionDivider({ variant }: { variant: DividerVariant }) {
  const config = dividerVariants[variant];
  return (
    <div className={cn('relative h-24 md:h-28 overflow-hidden home-divider-track bg-gradient-to-b', config.bg)} aria-hidden="true">
      <svg viewBox="0 0 1440 100" className="w-[140%] min-w-[960px] h-full home-divider-animated" preserveAspectRatio="none">
        <path d={config.path} className="fill-[var(--divider-light)] dark:fill-[var(--divider-dark)]" style={{
          ['--divider-light' as string]: config.fill,
          ['--divider-dark' as string]: config.darkFill,
        }} />
      </svg>
    </div>
  );
}

function Hero() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slogans.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[100vh] overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0">
        {!videoFailed && !reduced && (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/media/hero-fallback.svg"
            onError={() => setVideoFailed(true)}
          >
            <source src="/media/hero-fallback-video.webm" type="video/webm" />
          </video>
        )}
        {(videoFailed || reduced) && (
          <img
            src="/media/hero-fallback.svg"
            alt="hero fallback"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,14,24,0.55)_0%,rgba(11,14,24,0.42)_45%,rgba(11,14,24,0.72)_100%)]" />
      </div>

      {!reduced && (
        <div className="absolute inset-0 opacity-75">
          <CloudScene />
        </div>
      )}

      <div className="relative z-20 text-center max-w-3xl">
        <motion.img
          src="/brand/logo-main.svg"
          alt="openingClouds"
          className="mx-auto w-[min(86vw,560px)] h-auto"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />

        <div className="mt-8 h-16 md:h-20 overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              className="font-display text-2xl md:text-3xl text-white leading-tight"
              initial={reduced ? false : { y: 26, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduced ? undefined : { y: -26, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              {slogans[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.p
          className="mt-4 text-sm md:text-base tracking-[0.24em] uppercase text-white/80"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          Tech · Efficiency · Life
        </motion.p>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/75 text-xs tracking-[0.18em]"
        animate={reduced ? undefined : { y: [0, 6, 0] }}
        transition={reduced ? undefined : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        SCROLL ↓
      </motion.div>
    </section>
  );
}

function TimelineSection() {
  const reduced = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(timelineNodes[timelineNodes.length - 1].id);

  const maxMonth = Math.max(...timelineNodes.map((node) => monthDistance(node.start_date)));
  const minMonth = Math.min(...timelineNodes.map((node) => monthDistance(node.start_date)));
  const nowMonth = new Date().getFullYear() * 12 + new Date().getMonth();
  const progress = Math.min(1, Math.max(0, (nowMonth - minMonth) / Math.max(1, maxMonth - minMonth)));
  const activeNode = timelineNodes.find((node) => node.id === activeId) || timelineNodes[timelineNodes.length - 1];

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <FadeIn>
        <header className="mb-7 md:mb-9">
          <p className="text-xs uppercase tracking-[0.22em] text-ink-400 dark:text-ink-300">Section 2</p>
          <h2 className="text-3xl md:text-4xl text-ink-900 dark:text-ink-100 mt-2">人生足迹</h2>
          <p className="text-sm md:text-base text-ink-500 dark:text-ink-300 mt-2">出生 → 现在 → 未来，用一条可交互时间轴回看阶段转折。</p>
        </header>
      </FadeIn>

      <div className="relative overflow-x-auto rounded-3xl border border-ink-200/80 dark:border-ink-700/70 bg-white/72 dark:bg-ink-900/65 backdrop-blur p-5 md:p-7">
        <div className="min-w-[1024px]">
          <div className="relative h-20">
            <div className="absolute left-4 right-4 top-9 border-t-2 border-dashed border-ink-300 dark:border-ink-700" />
            <motion.div
              className="absolute left-4 top-9 border-t-2 border-primary-500"
              initial={reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: progress }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: 'calc(100% - 2rem)', transformOrigin: 'left' }}
            />

            <StaggerContainer className="absolute left-4 right-4 top-0 flex items-start justify-between" stagger={0.04}>
              {timelineNodes.map((node) => {
                const isReflection = node.type === 'reflection';
                const isHigh = node.impact === 'high';
                const isActive = node.id === activeId;
                return (
                  <StaggerItem key={node.id}>
                    <button
                      className="group text-center w-[76px] cursor-pointer"
                      onMouseEnter={() => setActiveId(node.id)}
                      onFocus={() => setActiveId(node.id)}
                      onClick={() => setActiveId(node.id)}
                    >
                      <div
                        className={cn(
                          'mx-auto mt-4 border-2 transition-transform duration-200',
                          isReflection ? 'w-4 h-4 rotate-45 rounded-[2px]' : isHigh ? 'w-5 h-5 rounded-full' : 'w-4 h-4 rounded-full',
                          isActive ? 'border-primary-500 bg-primary-500 shadow-[0_0_0_5px_rgba(79,106,229,0.14)]' : 'border-ink-300 bg-white dark:border-ink-500 dark:bg-ink-800'
                        )}
                      />
                      <p className="mt-3 text-[11px] font-medium text-ink-600 dark:text-ink-300">{node.start_date.slice(0, 4)}</p>
                      <p className="mt-1 text-[11px] leading-tight text-ink-500 dark:text-ink-400 line-clamp-2">{node.title}</p>
                    </button>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </div>

        <motion.article
          key={activeNode.id}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-ink-200/80 dark:border-ink-700/70 bg-ink-50/80 dark:bg-ink-800/40 p-4"
        >
          <div className="flex items-center flex-wrap gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs', categoryBadge(activeNode.type))}>
              <img src={typeIconPath(activeNode.type)} alt="" className="w-3.5 h-3.5" />
              {getTypeLabel(activeNode.type)}
            </span>
            <span className="text-xs text-ink-500 dark:text-ink-300">
              {formatShortDate(activeNode.start_date)}
              {activeNode.end_date ? ` - ${formatShortDate(activeNode.end_date)}` : ' - 至今'}
            </span>
          </div>
          <h3 className="font-display text-xl text-ink-900 dark:text-ink-100 mt-2">{activeNode.title}</h3>
          <p className={cn('text-sm mt-2', activeNode.type === 'reflection' ? 'italic text-ink-500 dark:text-ink-300' : 'text-ink-600 dark:text-ink-300')}>
            {activeNode.description}
          </p>
        </motion.article>
      </div>
    </section>
  );
}

function HighlightsSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <FadeIn>
        <header className="mb-7 md:mb-9">
          <p className="text-xs uppercase tracking-[0.22em] text-ink-400 dark:text-ink-300">Section 3</p>
          <h2 className="text-3xl md:text-4xl text-ink-900 dark:text-ink-100 mt-2">人生高光时刻</h2>
          <p className="text-sm md:text-base text-ink-500 dark:text-ink-300 mt-2">六张错位卡片，非线性叙事关键节点。</p>
        </header>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-12 gap-4 md:gap-5" stagger={0.07}>
        {highlightCards.map((card, index) => (
          <StaggerItem key={card.id} className={highlightLayout[index % highlightLayout.length]}>
            <CardSpotlight className="h-full p-0 overflow-hidden">
              <article className="h-full rounded-2xl bg-white/78 dark:bg-ink-900/68 border border-ink-200/80 dark:border-ink-700/70 overflow-hidden backdrop-blur">
                {card.cover ? (
                  <div className="blur-reveal-frame h-44 md:h-48 bg-ink-100 dark:bg-ink-800">
                    <img src={card.cover} alt={card.stage} className="w-full h-full object-cover blur-reveal" loading="lazy" />
                  </div>
                ) : (
                  <div className="h-44 md:h-48 relative">
                    <CoverFallbackArtwork category={card.type === 'learning' ? 'tech' : card.type === 'career' ? 'learning' : 'life'} seed={index + 2} variant="light" />
                  </div>
                )}
                <div className="p-4 md:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs', categoryBadge(card.type))}>
                      <img src={typeIconPath(card.type)} alt="" className="w-3.5 h-3.5" />
                      {getTypeLabel(card.type)}
                    </span>
                    {card.impact === 'high' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200">HIGH</span>
                    )}
                  </div>
                  <h3 className="font-display text-xl text-ink-900 dark:text-ink-100 mt-3">{card.stage}</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-300 mt-1">{card.period}</p>
                  <ul className="mt-3 space-y-1.5">
                    {card.achievements.slice(0, 4).map((item) => (
                      <li key={item} className="text-sm text-ink-600 dark:text-ink-300">
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </CardSpotlight>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}

function TravelSection() {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const visitedSet = useMemo(() => new Set(travelPlaces.map((item) => item.province)), []);

  const selected = travelPlaces.find((item) => item.province === tooltip?.province);

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <FadeIn>
        <header className="mb-7 md:mb-9 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-ink-400 dark:text-ink-300">Section 4</p>
            <h2 className="text-3xl md:text-4xl text-ink-900 dark:text-ink-100 mt-2">旅行足迹</h2>
            <p className="text-sm md:text-base text-ink-500 dark:text-ink-300 mt-2">点亮的省份会发光，鼠标悬停可查看城市记录。</p>
          </div>
          <div className="rounded-full px-4 py-2 text-sm border border-primary-200 bg-primary-50/80 text-primary-600 dark:border-primary-700/60 dark:bg-primary-900/25 dark:text-primary-200">
            已点亮 {visitedSet.size} / 34 省级行政区
          </div>
        </header>
      </FadeIn>

      <div ref={mapRef} className="relative rounded-3xl border border-ink-200/80 dark:border-ink-700/70 bg-white/75 dark:bg-ink-900/68 backdrop-blur p-4 md:p-6 overflow-hidden">
        <svg viewBox="0 0 1040 720" className="w-full h-auto">
          <rect x="40" y="30" width="960" height="640" rx="28" fill="currentColor" className="text-ink-100/70 dark:text-ink-800/60" />

          {allProvinceShapes.map((shape) => {
            const visited = visitedSet.has(shape.id);
            const isCurrent = shape.id === 'zhejiang';
            return (
              <path
                key={shape.id}
                d={shape.path}
                fill={visited ? (isCurrent ? '#4F6AE5' : '#7B93F0') : 'transparent'}
                fillOpacity={visited ? (isCurrent ? 0.55 : 0.42) : 0}
                stroke={visited ? '#4F6AE5' : '#A9B4CB'}
                strokeWidth={visited ? 2.6 : 2}
                className="transition-all duration-200 cursor-pointer"
                onMouseMove={(event) => {
                  const bounds = mapRef.current?.getBoundingClientRect();
                  if (!bounds) return;
                  setTooltip({
                    province: shape.id,
                    x: event.clientX - bounds.left,
                    y: event.clientY - bounds.top,
                  });
                }}
                onMouseEnter={(event) => {
                  const bounds = mapRef.current?.getBoundingClientRect();
                  if (!bounds) return;
                  setTooltip({
                    province: shape.id,
                    x: event.clientX - bounds.left,
                    y: event.clientY - bounds.top,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {travelPlaces.map((place) => place.marker).filter(Boolean).map((marker) => {
            const isCurrent = marker?.icon === 'star' || marker?.city === '杭州';
            if (!marker) return null;
            return (
              <g key={marker.city}>
                {isCurrent ? (
                  <text x={marker.x - 7} y={marker.y + 4} fontSize="14" fill="#4F6AE5">★</text>
                ) : (
                  <circle cx={marker.x} cy={marker.y} r="3" fill="#4F6AE5" />
                )}
              </g>
            );
          })}
        </svg>

        {tooltip && (
          <div
            className="absolute pointer-events-none z-20 w-60 rounded-xl border border-ink-200/80 dark:border-ink-700/70 bg-white/92 dark:bg-ink-900/90 backdrop-blur-sm p-3 shadow-soft"
            style={{ left: Math.min(Math.max(tooltip.x + 14, 12), (mapRef.current?.clientWidth ?? 640) - 260), top: Math.max(tooltip.y - 18, 12) }}
          >
            <h3 className="font-semibold text-ink-900 dark:text-ink-100">{allProvinceShapes.find((shape) => shape.id === tooltip.province)?.label}</h3>
            {selected ? (
              <ul className="mt-2 space-y-1">
                {selected.cities.map((city) => (
                  <li key={city.name + city.period} className="text-xs text-ink-600 dark:text-ink-300">
                    {city.name} · {city.period} · {city.tag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-300">尚未探索</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SocialSection() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tooltip, setTooltip] = useState<SocialTooltip | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setIsAdmin(document.cookie.includes('oc_admin_token='));
  }, []);

  const friendPositions = useMemo(() => {
    const positionMap = new Map<string, { x: number; y: number }>();
    const grouped = new Map<string, FriendNode[]>();
    friendNodes.forEach((friend) => {
      const bucket = grouped.get(friend.stageId) || [];
      bucket.push(friend);
      grouped.set(friend.stageId, bucket);
    });

    grouped.forEach((group, stageId) => {
      const stage = stageNodes.find((item) => item.id === stageId);
      if (!stage) return;
      group.forEach((friend, index) => {
        const angle = (index / Math.max(1, group.length)) * Math.PI * 2;
        const radius = 58 + (index % 3) * 18;
        positionMap.set(friend.id, {
          x: stage.x + Math.cos(angle) * radius,
          y: stage.y + Math.sin(angle) * radius,
        });
      });
    });

    return positionMap;
  }, []);

  const tooltipFriend = tooltip ? friendNodes.find((friend) => friend.id === tooltip.friendId) : null;

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <FadeIn>
        <header className="mb-7 md:mb-9">
          <p className="text-xs uppercase tracking-[0.22em] text-ink-400 dark:text-ink-300">Section 5</p>
          <h2 className="text-3xl md:text-4xl text-ink-900 dark:text-ink-100 mt-2">社交图谱</h2>
          <p className="text-sm md:text-base text-ink-500 dark:text-ink-300 mt-2">
            访客默认匿名光点；登录后台后可看到完整节点信息。当前状态：
            <span className="font-medium text-primary-500">{isAdmin ? '管理员视角' : '访客视角'}</span>
          </p>
        </header>
      </FadeIn>

      <div ref={containerRef} className="relative rounded-3xl border border-ink-200/80 dark:border-ink-700/70 bg-white/74 dark:bg-ink-900/68 backdrop-blur p-4 md:p-6 overflow-hidden">
        <svg viewBox="0 0 1040 470" className="w-full h-auto">
          {stageNodes.slice(0, -1).map((stage, index) => {
            const next = stageNodes[index + 1];
            return (
              <line
                key={`${stage.id}-${next.id}`}
                x1={stage.x}
                y1={stage.y}
                x2={next.x}
                y2={next.y}
                stroke="#8DA0CF"
                strokeOpacity="0.45"
                strokeWidth="1.5"
              />
            );
          })}

          {friendNodes.map((friend) => {
            const point = friendPositions.get(friend.id);
            const stage = stageNodes.find((node) => node.id === friend.stageId);
            if (!point || !stage) return null;
            const color = socialCategoryFill[stage.category];
            return (
              <g key={friend.id}>
                <line x1={stage.x} y1={stage.y} x2={point.x} y2={point.y} stroke={color} strokeOpacity="0.3" strokeWidth="1.2" />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isAdmin ? 6 : 4.6}
                  fill={isAdmin ? color : '#9BA4BA'}
                  onMouseEnter={(event) => {
                    const bounds = containerRef.current?.getBoundingClientRect();
                    if (!bounds) return;
                    setTooltip({ friendId: friend.id, x: event.clientX - bounds.left, y: event.clientY - bounds.top });
                  }}
                  onMouseMove={(event) => {
                    const bounds = containerRef.current?.getBoundingClientRect();
                    if (!bounds) return;
                    setTooltip({ friendId: friend.id, x: event.clientX - bounds.left, y: event.clientY - bounds.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  className="cursor-pointer"
                />
              </g>
            );
          })}

          {stageNodes.map((stage) => (
            <g key={stage.id}>
              <circle cx={stage.x} cy={stage.y} r={24} fill={socialCategoryFill[stage.category]} fillOpacity="0.18" stroke={socialCategoryFill[stage.category]} strokeWidth="2" />
              <text x={stage.x} y={stage.y + 4} textAnchor="middle" fontSize="14" fill="#1A1D2E">{stage.label}</text>
            </g>
          ))}
        </svg>

        {tooltip && tooltipFriend && (
          <div
            className="absolute z-20 pointer-events-none w-56 rounded-xl border border-ink-200/80 dark:border-ink-700/70 bg-white/94 dark:bg-ink-900/95 backdrop-blur-sm p-3 shadow-soft"
            style={{ left: Math.min(Math.max(tooltip.x + 12, 12), (containerRef.current?.clientWidth ?? 640) - 230), top: Math.max(tooltip.y - 12, 12) }}
          >
            <p className="font-medium text-ink-900 dark:text-ink-100">
              {isAdmin ? tooltipFriend.name : tooltipFriend.publicLabel}
            </p>
            <p className="text-xs text-ink-500 dark:text-ink-300 mt-1">
              {isAdmin ? tooltipFriend.bio : '一位在这个阶段互相照亮的人'}
            </p>
            {!isAdmin && <p className="text-[11px] text-ink-400 dark:text-ink-400 mt-1">登录后台后可查看详细信息</p>}
          </div>
        )}
      </div>
    </section>
  );
}

function DataPanelSection({ stats }: { stats: HomeStats }) {
  const cards = [
    { id: 'posts', label: '篇文章', value: stats.totalPosts, icon: '/icons/stats/posts.svg' },
    { id: 'words', label: '总字数', value: stats.totalWords, icon: '/icons/stats/words.svg' },
    { id: 'tags', label: '个标签', value: stats.totalTags, icon: '/icons/stats/tags.svg' },
    { id: 'days', label: '天', value: stats.activeDays, icon: '/icons/stats/days.svg' },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <FadeIn>
        <header className="mb-7 md:mb-9">
          <p className="text-xs uppercase tracking-[0.22em] text-ink-400 dark:text-ink-300">Section 6</p>
          <h2 className="text-3xl md:text-4xl text-ink-900 dark:text-ink-100 mt-2">数据面板</h2>
        </header>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" stagger={0.07}>
        {cards.map((card) => (
          <StaggerItem key={card.id}>
            <CardSpotlight className="h-full p-4 md:p-5">
              <div className="h-full rounded-2xl border border-ink-200/80 dark:border-ink-700/70 bg-white/85 dark:bg-ink-900/70 p-4 md:p-5 flex flex-col justify-between">
                <img src={card.icon} alt="" className="w-6 h-6" />
                <div className="mt-6">
                  <p className="font-display text-3xl md:text-4xl text-ink-900 dark:text-ink-100"><AnimatedNumber value={card.value} /></p>
                  <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">{card.label}</p>
                </div>
              </div>
            </CardSpotlight>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <p className="text-center text-sm text-ink-500 dark:text-ink-300 mt-6">
        技术 {stats.byCategory.tech} 篇 · 效率 {stats.byCategory.learning} 篇 · 生活 {stats.byCategory.life} 篇
      </p>
    </section>
  );
}

function ConnectSection() {
  const [copied, setCopied] = useState(false);
  const email = 'openingclouds@outlook.com';

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-6 pt-12 pb-16 md:pt-16 md:pb-20">
      <FadeIn>
        <div className="relative rounded-3xl border border-ink-200/80 dark:border-ink-700/70 bg-white/78 dark:bg-ink-900/68 backdrop-blur-sm p-6 md:p-10 overflow-hidden">
          <BackgroundBeams className="opacity-45" />
          <div className="relative z-10 text-center">
            <h2 className="font-display text-4xl text-ink-900 dark:text-ink-100">Let's Connect</h2>
            <div className="mt-8 grid sm:grid-cols-2 gap-3 md:gap-4">
              <button
                onClick={copyEmail}
                className="group rounded-2xl border border-ink-200/80 dark:border-ink-700/70 bg-white/82 dark:bg-ink-900/70 px-4 py-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="flex items-center justify-center gap-2 text-ink-900 dark:text-ink-100 font-medium">
                  <img src="/icons/contact/mail.svg" alt="" className="w-5 h-5" />
                  Email
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-300 mt-1">点击复制邮箱</p>
              </button>

              <a
                href="https://github.com/hqy2020"
                target="_blank"
                rel="noopener"
                className="group rounded-2xl border border-ink-200/80 dark:border-ink-700/70 bg-white/82 dark:bg-ink-900/70 px-4 py-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="flex items-center justify-center gap-2 text-ink-900 dark:text-ink-100 font-medium">
                  <img src="/icons/contact/github.svg" alt="" className="w-5 h-5" />
                  GitHub
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-300 mt-1">@hqy2020</p>
              </a>
            </div>

            <p className="text-xs text-ink-500 dark:text-ink-300 mt-8">
              © {new Date().getFullYear()} openingClouds · Built with Astro
            </p>
          </div>

          <AnimatePresence>
            {copied && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute right-4 top-4 rounded-lg bg-ink-900 text-white text-xs px-3 py-1.5"
              >
                已复制邮箱：{email}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FadeIn>
    </section>
  );
}

export function HomePageExperience({ stats }: HomePageExperienceProps) {
  return (
    <>
      <Hero />
      <SectionDivider variant="cloud" />
      <TimelineSection />
      <SectionDivider variant="wave" />
      <HighlightsSection />
      <SectionDivider variant="tide" />
      <TravelSection />
      <SectionDivider variant="ridge" />
      <SocialSection />
      <SectionDivider variant="dust" />
      <DataPanelSection stats={stats} />
      <SectionDivider variant="flow" />
      <ConnectSection />
    </>
  );
}
