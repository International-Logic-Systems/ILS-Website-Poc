/**
 * Serialises the site's typed content modules into knowledge documents.
 *
 * The rendered pages already carry most of this as prose, but the typed data
 * carries two things the HTML does not:
 *
 *   1. Identifiers in isolation. A contract number sits inside a table cell on
 *      the page; here it is a labelled line, so lexical search finds it.
 *   2. Derived status. `statusOf()` decides whether a vehicle is active or
 *      expired from its period of performance. Writing that out means the
 *      assistant says "expired" for the same reason the badge does, instead of
 *      repeating a sales line about three available vehicles.
 */

import { register } from 'node:module';

register('./ts-hook.mjs', new URL('../', import.meta.url).href);

/** Loads the content modules through the TypeScript resolver hook. */
async function loadModules() {
  const [content, vehicles] = await Promise.all([
    import('../../lib/content.ts'),
    import('../../lib/vehicles.ts'),
  ]);
  return { content, vehicles };
}

function organisationDoc({ content }) {
  const { org } = content;
  return {
    source: 'facts',
    title: 'Company facts',
    path: '/about',
    sections: [
      {
        heading: 'Identity and credentials',
        text: [
          `Legal name: ${org.name}, known as ${org.short}.`,
          `What ILS does: ${org.tagline}`,
          org.sub,
          `Headquarters address: ${org.hq.join(', ')}.`,
          `Credentials and compliance marks: ${org.credentials.join('; ')}.`,
          `CMMI appraisal: appraised at CMMI ${content.cmmi.level} (${content.cmmi.levelShort}) against the ${content.cmmi.models.join(' and ')} models. Appraisal number ${content.cmmi.appraisalNumber}. Valid to ${content.cmmi.expiresLabel}. The appraisal was performed by ${content.cmmi.leadAppraiser}. Who performed the CMMI appraisal? ${content.cmmi.leadAppraiser} performed it; ISACA is not the appraising organization. Appraised organizational unit: ${content.cmmi.unit}. Verifiable in the Published Appraisal Results (PARS) directory at ${content.cmmi.parsUrl}. ILS is appraised, not certified — ISACA does not certify or accredit appraisal results.`,
          `Compliance marks shown on the home page: ${org.compliance.join('; ')}.`,
          `LinkedIn: ${org.social.linkedin}. X / Twitter: ${org.social.twitter}.`,
        ].join('\n\n'),
      },
    ],
  };
}

function leadershipDoc({ content }) {
  return {
    source: 'facts',
    title: 'Leadership',
    path: '/leadership',
    sections: [
      {
        heading: 'Leadership team',
        // Nobody types "Chief Executive Officer". Lexical search cannot bridge
        // to an acronym on its own, so the corpus carries both forms.
        text: content.leadership
          .map((leader) => {
            const acronym = leader.role
              .split(/\s+/)
              .filter((word) => /^[A-Z]/.test(word))
              .map((word) => word[0])
              .join('');
            const short = acronym.length >= 2 ? ` (${acronym})` : '';
            return `${leader.name} is the ${leader.role}${short} of International Logic Systems (ILS). ${leader.role}${acronym.length >= 2 ? ` / ${acronym}` : ''}: ${leader.name}.`;
          })
          .join('\n\n'),
      },
    ],
  };
}

function vehiclesDoc({ vehicles: mod }) {
  const { vehicles, statusOf, STATUS_LABEL, periodOf } = mod;

  return {
    source: 'facts',
    title: 'Contract Vehicles',
    path: '/contracts',
    sections: [
      {
        heading: 'Vehicles at a glance',
        text: [
          `ILS has been awarded ${vehicles.length} contract vehicles.`,
          ...vehicles.map((v) => {
            const status = STATUS_LABEL[statusOf(v)];
            return `${v.name} (${v.short}), contract number ${v.number}, awarded by ${v.agency}. Period of performance ${periodOf(v)}. Current status: ${status}.`;
          }),
          'Status is derived from each period of performance rather than asserted, so a vehicle past its end date is reported as expired.',
        ].join('\n\n'),
      },
      ...vehicles.map((v) => {
        const status = STATUS_LABEL[statusOf(v)];
        const lines = [
          `${v.fullName}.`,
          `Contract number: ${v.number}.`,
          `Awarding agency: ${v.agency}.`,
          `Period of performance: ${periodOf(v)}.`,
          `Status: ${status}.`,
          // Stated in the words the question will use. Nothing in the corpus
          // otherwise connects "is it still active?" to the word "Expired".
          (() => {
            const ends = periodOf(v).split(' — ')[1];
            const begins = periodOf(v).split(' — ')[0];
            switch (statusOf(v)) {
              case 'expired':
                return `Is ${v.short} still active, current or available to order from? No — ${v.name} is expired. Its period of performance ended on ${ends}.`;
              case 'awarded':
                return `Is ${v.short} active or available to order from yet? Not yet — the period of performance for ${v.name} does not begin until ${begins}, and runs to ${ends}.`;
              case 'expiring':
                return `Is ${v.short} still active, current and available to order from? Yes — ${v.name} is active, but its period of performance ends soon, on ${ends}.`;
              default:
                return `Is ${v.short} still active, current and available to order from? Yes — ${v.name} is active until ${ends}.`;
            }
          })(),
          `Detail page: /contracts/${v.slug}.`,
          v.summary,
          ...v.overview,
        ];

        if (v.scope) lines.push(`${v.scope.label}: ${v.scope.items.join('; ')}.`);
        if (v.sins) {
          lines.push(
            ...v.sins.map((s) => `${s.code} — ${s.title}. ${s.body}${s.note ? ` ${s.note}` : ''}`),
          );
        }
        if (v.terms) lines.push(...v.terms.map((t) => `${t.label}: ${t.value}.`));
        if (v.documents) {
          lines.push(
            `Published contract documents: ${v.documents.map((d) => `${d.label} (${d.href})`).join('; ')}.`,
          );
        }
        lines.push(
          ...v.pocs.map(
            (p) =>
              `Point of contact for ${v.short}: ${p.name}, ${p.role}. Email ${p.email}. Phone ${p.phone}.${p.fax ? ` Fax ${p.fax}.` : ''}`,
          ),
        );
        if (v.external) lines.push(`Awarding agency page: ${v.external.href}.`);

        return { heading: `${v.name} — ${v.number}`, text: lines.join('\n\n') };
      }),
    ],
  };
}

function capabilitiesDoc({ content }) {
  const { solutions, services } = content;
  return {
    source: 'facts',
    title: 'Capabilities',
    path: '/capabilities',
    sections: [
      {
        heading: 'How we engage',
        text: solutions.map((s) => `${s.title}. ${s.body}`).join('\n\n'),
      },
      {
        heading: 'Service lines',
        text: [
          `ILS publishes ${services.length} service lines.`,
          ...services.map((s) => `${s.title} (${s.tags}). ${s.body}`),
        ].join('\n\n'),
      },
    ],
  };
}

function customersDoc({ content }) {
  return {
    source: 'facts',
    title: 'Customers',
    path: '/customers',
    sections: [
      {
        heading: 'Federal customers',
        text: content.customers
          .map((c) => `${c.name}. ${c.detail} More at ${c.url}.`)
          .join('\n\n'),
      },
    ],
  };
}

function careersDoc({ content }) {
  const { benefits, careersPortal } = content;
  return {
    source: 'facts',
    title: 'Careers',
    path: '/careers',
    sections: [
      {
        heading: 'Applying to ILS',
        // People ask about "jobs"; the site says "roles" and "positions". The
        // corpus has to carry the word the question will use.
        text: [
          'Open roles are listed on the ILS careers page at /careers, read live from the applicant tracking system, which remains the system of record.',
          `How to apply for a job at ILS: search and apply for jobs, careers and open positions through the ILS applicant tracking system at ${careersPortal}. Applications are submitted there rather than by email.`,
          `Search open positions: ${careersPortal}`,
        ].join('\n\n'),
      },
      {
        heading: 'Employee benefits',
        text: [
          "At ILS, we appreciate our employees' hard work and dedication. We are committed to providing a comprehensive benefits package to support the needs of our employees and their families.",
          ...benefits.map((b) => `Employee benefit — ${b.title}: ${b.body}`),
        ].join('\n\n'),
      },
    ],
  };
}

function newsDoc({ content }) {
  return {
    source: 'facts',
    title: 'News',
    path: '/news',
    sections: [
      {
        heading: 'Published record',
        text: content.news.map((n) => `${n.date} — ${n.title}. ${n.body}`).join('\n\n'),
      },
    ],
  };
}

function contactDoc({ content }) {
  const { org } = content;
  return {
    source: 'facts',
    title: 'Contact',
    path: '/contact',
    sections: [
      {
        heading: 'How to reach ILS',
        text: [
          `Headquarters and postal address: ${org.hq.join(', ')}.`,
          'Enquiries can be started from the contact page at /contact.',
          `LinkedIn: ${org.social.linkedin}.`,
          `X / Twitter: ${org.social.twitter}.`,
          'Points of contact named against each contract vehicle are listed on that vehicle’s page under /contracts.',
        ].join('\n\n'),
      },
    ],
  };
}

/** Builds every fact document from the site's typed content modules. */
export async function collectFactDocuments() {
  const modules = await loadModules();
  return [
    organisationDoc(modules),
    leadershipDoc(modules),
    vehiclesDoc(modules),
    capabilitiesDoc(modules),
    customersDoc(modules),
    careersDoc(modules),
    newsDoc(modules),
    contactDoc(modules),
  ];
}
