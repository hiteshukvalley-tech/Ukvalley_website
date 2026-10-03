// Content for /social-impact ("Our Social Impact"). Photos live in
// public/social-impact/. Text follows ukvalley.com/our_social_impact.

export const socialImpactIntro = {
  eyebrow: "Our social impact",
  title: "Technology that gives back to the communities we serve",
  paragraphs: [
    "At Ukvalley Technologies, our commitment to social responsibility is deeply ingrained in our mission to empower communities through technology. We believe that innovation should not only drive business success but also contribute positively to society.",
    "Over the past five years, we have actively engaged in initiatives that uplift individuals and organizations in our region. By partnering with non-profit organizations and local enterprises, we aim to address pressing social challenges and enhance access to technology and education.",
    "Our initiatives include providing training programs that equip individuals with valuable digital skills, offering technological support to local businesses, and contributing to community development projects. Through these efforts, we strive to create a lasting impact, fostering growth and resilience in the communities we serve.",
    "As we continue to expand our reach, we are dedicated to furthering our social contributions, ensuring that our growth benefits not only our clients but also the wider community.",
  ],
};

export type ImpactPhoto = { src: string; alt: string; /** Tailwind object-position class for the crop, e.g. "object-[50%_60%]" */ focus?: string };
export type ImpactGroup = { id: string; title: string; description: string; /** badge shown on the pictures */ caption: string; photos: ImpactPhoto[] };

const photos = (prefix: string, count: number, alt: string): ImpactPhoto[] =>
  Array.from({ length: count }, (_, i) => ({
    src: `/social-impact/${prefix}-${String(i + 1).padStart(2, "0")}.webp`,
    alt: `${alt} — photo ${i + 1}`,
  }));

export const socialImpactGroups: ImpactGroup[] = [
  {
    id: "social-activities",
    caption: "Tree Plantation",
    title: "Social Activities",
    description:
      "Giving back starts close to home. Our team comes together for tree plantation drives and community activities that leave the places we live and work a little greener.",
    photos: photos("tree", 6, "Ukvalley team at a tree plantation drive"),
  },
  {
    id: "sports-event",
    caption: "Cricket",
    title: "Sports Event",
    description: "Cricket, teamwork and friendly competition — our sports days keep the team active, connected and energised.",
    photos: photos("sports", 1, "Ukvalley team cricket match"),
  },
  {
    id: "celebrations",
    caption: "Celebrations",
    title: "Celebrations and Get-Together",
    description:
      "Festivals, milestones and get-togethers are how we celebrate our people and the culture we build together.",
    photos: photos("celebration", 9, "Ukvalley team celebration"),
  },
  {
    id: "ganpati-utsav",
    caption: "Ganpati Utsav",
    title: "Ganpati Utsav",
    description:
      "Every year the whole Ukvalley family gathers at the office to welcome Bappa — a beautifully decorated shrine, aarti together and plenty of smiles.",
    photos: [
      { src: "/social-impact/ganpati-01.webp", alt: "Ukvalley team celebrating Ganpati Utsav at the office", focus: "object-[50%_45%]" },
      { src: "/social-impact/ganpati-02.webp", alt: "Ganpati shrine decorated with marigold garlands, roses and lights", focus: "object-[50%_62%]" },
      { src: "/social-impact/ganpati-03.webp", alt: "Ukvalley team and families at the Ganpati Utsav celebration", focus: "object-[50%_45%]" },
    ],
  },
  {
    id: "workshops",
    caption: "AI Workshop",
    title: "Workshops",
    description:
      "Sharing what we know. Our AI and technology workshops help students, professionals and local businesses build practical digital skills.",
    photos: photos("workshop", 19, "Ukvalley AI workshop"),
  },
];
