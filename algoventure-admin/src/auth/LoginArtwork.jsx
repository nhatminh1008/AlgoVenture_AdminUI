const leftTopics = [
  {
    title: "Stack",
    diagram: (
      <>
        <path d="M24 45 72 61l48-16M24 33l48 16 48-16" />
        <path className="topic-fill" d="M24 21 72 5l48 16-48 16z" />
      </>
    ),
  },
  {
    title: "Linked List",
    diagram: (
      <>
        <path d="M38 32h22m-5-5 5 5-5 5m29-5h22m-5-5 5 5-5 5" />
        <rect className="topic-fill" x="13" y="20" width="25" height="24" rx="6" />
        <rect className="topic-fill" x="60" y="20" width="24" height="24" rx="6" />
        <rect className="topic-fill" x="106" y="20" width="25" height="24" rx="6" />
      </>
    ),
  },
  {
    title: "Binary Tree",
    diagram: (
      <>
        <path d="M72 12 44 33l-18 21m18-21 16 21M72 12l28 21 18 21m-18-21-16 21" />
        <circle className="topic-focus" cx="72" cy="12" r="7" />
        <circle className="topic-fill" cx="44" cy="33" r="6" />
        <circle className="topic-fill" cx="100" cy="33" r="6" />
        {[26, 60, 84, 118].map((x) => (
          <circle key={x} className="topic-fill" cx={x} cy="54" r="5" />
        ))}
      </>
    ),
  },
];

const rightTopics = [
  {
    title: "Bubble Sort",
    diagram: (
      <>
        <path d="M17 57h110M62 17q15-14 30-3m-7 1 7-1-2-7" />
        {[18, 35, 24, 43, 50].map((height, index) => (
          <rect
            key={height}
            className={index === 1 || index === 2 ? "topic-focus" : "topic-fill"}
            x={22 + index * 21}
            y={57 - height}
            width="14"
            height={height}
            rx="3"
          />
        ))}
      </>
    ),
  },
  {
    title: "Binary Search",
    diagram: (
      <>
        <path d="M14 45v6h116v-6M72 51v8m-4-4 4 4 4-4" />
        {[2, 4, 7, 9, 12].map((value, index) => {
          const x = 24 + index * 24;
          return (
            <g key={value}>
              <rect className={index === 2 ? "topic-focus" : "topic-fill"} x={x - 10} y="17" width="20" height="22" rx="4" />
              <text x={x} y="32" className="topic-number">{value}</text>
            </g>
          );
        })}
      </>
    ),
  },
  {
    title: "BFS",
    diagram: (
      <>
        <path d="M24 35 55 13l42 6 24 25-47 9-50-18 73-16m-42-6 19 40" />
        <path className="topic-route" d="m24 35 31-22m-31 22 50 18" />
        <circle className="topic-focus" cx="24" cy="35" r="7" />
        <circle className="topic-focus" cx="55" cy="13" r="6" />
        <circle className="topic-focus" cx="74" cy="53" r="6" />
        <circle className="topic-fill" cx="97" cy="19" r="6" />
        <circle className="topic-fill" cx="121" cy="44" r="6" />
      </>
    ),
  },
];

export default function LoginArtwork() {
  return (
    <div className="login-artwork" aria-hidden="true">
      {[leftTopics, rightTopics].map((topics) => (
        <div className="login-topic-column" key={topics[0].title}>
          {topics.map(({ title, diagram }) => (
            <div className="login-topic" key={title}>
              <svg className="login-topic-diagram" viewBox="0 0 144 64" fill="none">
                {diagram}
              </svg>
              <span>{title}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
