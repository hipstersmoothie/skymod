import localFont from "next/font/local";
import { getLabelers, Labeler } from "../data/get-labelers";
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import BlueSkyLogo from "../components/BlueSkyLogo";
import { Tooltip, TooltipContent } from "../components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { memo, useMemo, useState } from "react";
import { Input } from "../components/ui/input";
import debounce from "lodash.debounce";
import GithubLogo from "../components/GithubLogo";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

function Link(props: React.ComponentProps<"a">) {
  return (
    <a
      {...props}
      aria-label="View labeler"
      className="text-blue-dim underline underline-offset-4"
      target="_blank"
      rel="noopener noreferrer"
    />
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-mauve-4 dark:bg-mauvedark-4 flex px-2 py-1 text-xs text-mauve-dim rounded-full">
      {children}
    </div>
  );
}

function Labels({ labeler }: { labeler: Labeler }) {
  const [showAll, setShowAll] = useState(false);

  if (!labeler.policies.labelValueDefinitions) {
    return null;
  }

  const visibleLabels = showAll
    ? labeler.policies.labelValueDefinitions
    : labeler.policies.labelValueDefinitions.slice(0, 8);

  return (
    <ul className="flex flex-wrap gap-2">
      {visibleLabels.map((label, index) => (
        <li key={`${labeler.uri}-${label.identifier}-${index}`}>
          <Tooltip>
            <TooltipTrigger>
              <Pill>{label.identifier}</Pill>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label.locales[0].description}</p>
            </TooltipContent>
          </Tooltip>
        </li>
      ))}
      <li>
        <button type="button" onClick={() => setShowAll((showAll) => !showAll)}>
          <div className="bg-mauve-action flex px-2 py-1 text-xs text-mauve-dim rounded-full self-start">
            {showAll ? "Hide" : "Show All"}
          </div>
        </button>
      </li>
    </ul>
  );
}

function Description({ labeler }: { labeler: Labeler }) {
  const content = useMemo(() => {
    const children: React.ReactNode[] = [];

    for (const segment of labeler.creator.description) {
      if (segment.type === "link" && segment.uri) {
        children.push(
          <Link key={segment.uri} href={segment.uri}>
            {segment.text}
          </Link>
        );
      } else if (segment.type === "mention" && segment.did) {
        children.push(
          <Link
            key={segment.did}
            href={`https://my-bsky-app.com/user/${segment.did}`}
          >
            {segment.text}
          </Link>
        );
      } else {
        children.push(segment.text);
      }
    }

    return children;
  }, [labeler]);

  return (
    <p className="whitespace-pre-line break-words text-sm text-gray-500">
      {content}
    </p>
  );
}

const LabelerCard = memo(function LabelerCard({
  labeler,
}: {
  labeler: Labeler;
}) {
  return (
    <div className="bg-gray-subtle rounded-lg border-2 border-mauve-dim p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 justify-between">
            <div className="flex gap-2 items-center flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-mauve-dim">
                {labeler.creator.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={labeler.creator.avatar} alt="" />
                ) : (
                  <div className="bg-mauve-9 dark:bg-mauvedark-9 h-full w-full" />
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex gap-2 items-center">
                  <div className="text-sm font-bold min-w-0 text-ellipsis whitespace-nowrap overflow-hidden">
                    {labeler.creator.displayName ||
                      `@${labeler.creator.handle}`}
                  </div>
                  <Pill>{labeler.likeCount || 0}</Pill>
                </div>

                {labeler.creator.displayName && (
                  <div className="text-xs text-gray-500">
                    @{labeler.creator.handle}
                  </div>
                )}
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={`https://bsky.app/profile/${labeler.creator.did}`}
                  aria-label="View labeler"
                  className="bg-gray-action p-2 rounded-lg self-start"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <OpenInNewWindowIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>View labeler on BlueSky</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Description labeler={labeler} />
        <Labels labeler={labeler} />
      </div>
    </div>
  );
});

export default function Home({ labelers }: { labelers: Labeler[] }) {
  const year = new Date().getFullYear();
  const [search, setSearch] = useState("");
  const [visibleLabelers, setVisibleLabelers] = useState(labelers);
  const setVisibleLabelersDebounced = useMemo(
    () =>
      debounce((filter: string) => {
        const term = filter.toLowerCase();

        console.log("SET");
        setVisibleLabelers(
          labelers.filter(
            (labeler) =>
              labeler.creator.displayName?.toLowerCase().includes(term) ||
              labeler.creator.handle?.toLowerCase().includes(term) ||
              labeler.creator.description
                .map((segment) => {
                  if (segment.type === "text") {
                    return segment.text.toLowerCase();
                  } else if (segment.type === "link") {
                    return segment.uri.toLowerCase();
                  } else if (segment.type === "mention") {
                    return segment.did.toLowerCase();
                  }
                })
                .join(" ")
                .includes(term) ||
              labeler.policies.labelValueDefinitions?.some((d) =>
                d.identifier.toLowerCase().includes(term)
              )
          )
        );
      }, 500),
    [labelers]
  );

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setVisibleLabelersDebounced(e.target.value);
  }

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} flex flex-col gap-16 font-[family-name:var(--font-geist-sans)] min-h-screen`}
    >
      <main className="px-8 sm:p-20 pb-20 flex flex-col row-start-2 items-center sm:items-start flex-1">
        <div className="flex gap-5 py-10">
          <BlueSkyLogo />
          <h1 className="text-3xl font-semibold">BlueSky Labelers</h1>
        </div>
        <div className="flex flex-col gap-3">
          <p>
            <a
              className="text-blue-dim underline underline-offset-4"
              href="https://docs.bsky.app/docs/advanced-guides/moderation"
            >
              Labels
            </a>{" "}
            are a way to categorize content and users on BlueSky. They are part
            of the moderation tools but they can be do lots of interesting
            things like foster community.
          </p>
          <p>
            If you&apos;re interested in building your own labeler, check out{" "}
            <a
              className="text-blue-dim underline underline-offset-4"
              href="https://github.com/aliceisjustplaying/labeler-starter-kit-bsky"
            >
              this project
            </a>
            .
          </p>
        </div>
        <Input
          placeholder="Search labelers"
          value={search}
          onChange={handleSearchChange}
          className="mt-8"
        />
        <ol className="grid gap-4 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 my-8">
          {visibleLabelers.map((labeler) => (
            <li key={labeler.uri}>
              <LabelerCard labeler={labeler} />
            </li>
          ))}
        </ol>
      </main>
      <footer className="row-start-3 text-mauve-dim  flex flex-col gap-4 flex-wrap items-center justify-center p-8 bg-mauve-3 dark:bg-mauvedark-3">
        <div className="flex gap-4">
          <Tooltip>
            <TooltipTrigger>
              <a
                href="https://bsky.app/profile/hipstersmoothie.com"
                target="_blank"
                rel="noopener"
              >
                <BlueSkyLogo size="small" color="currentColor" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>View creator on BlueSky</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <a
                href="https://bsky.app/profile/hipstersmoothie.com"
                target="_blank"
                rel="noopener"
              >
                <GithubLogo size="small" color="currentColor" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>View source on Github</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-sm">Copyright © {year} Andrew Lisowski.</div>
      </footer>
    </div>
  );
}

export async function getStaticProps() {
  return {
    // revalidate every day
    revalidate: 60 * 60 * 24,
    props: {
      labelers: await getLabelers(),
    },
  };
}
