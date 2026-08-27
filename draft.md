# AI won’t take your job. It will remove the need for it.

AI is all over the news for a while now and there is no denying that it is getting good.

Inevitability, some variant of "What will we do when AI does everything?" comes up.

Honestly, at that point things like the "Jevons paradox" or "New jobs will appear" have started to feel like copium rather than an actual plan.

I have done a ton of research while writing this article and I couldn't find an intellectually honest argument that a particular job is truly safe.

How are you are supposed to do to keep paying your mortgage, cover the bills or support your family?

It would be pretentious of me to say I know exactly what you should do. But I do have are a few pointers.

## Humans are not horse

The machines replaced horses. Why should humans be any different?

I never like this comparison but it took me a while to articulate why.

Economically, horse was basically converting food into mechanical power. When machines became better at turning energy into motion, they couldn't just change what they were good at.

Unlike horses, humans are different. We can learn and re-invent ourselves.

We do not know what the next jobs will be or if AI will create new jobs at all. But try to explain cybersecurity to someone from the 1950s.

## AI won’t take your job. Someone using AI will.

Bullshit.

They want us to imagine a world where there are still accountants, designers, programmers or lawyers doing roughly what they do today but with AI making them faster.

Finding ways to do exactly the same job you are currently doing is short sighted.

I would be a lot more worried about someone who's trying to figure out how to automate my job entirely than someone who can do it faster.

Overt time, processes will be redesigned around what the machines can do.

What happens once a computer can read the input, make the decision, use the software you use via MCP, check its own work and only escalate the unusual cases?

## Replacing a steam engine with an electric one

There is enough written about the Industrial Revolution that if I talk too much about it, you'll probably just close the tab.

This story is a related subset but much more interesting than simply saying "machines replaced all human labor".

By the late 19th century, many large factories had one central steam engine. It turned a line shaft running through the building and everything was connected to it.

The entire factory was designed around transmitting mechanical power from one central point.

Then when electricity arrived, they replaced the steam engine with a more efficient electric motor.

But everything downstream remained basically the same. A big source of power turned the same shaft, which still turned the same belts and pulleys.

They made the steam factory better.

But only when electricity was distributed through wires, smaller motors could then be attached directly to individual machines.

The machines no longer had to be arranged around the shaft. They could be placed wherever the work required them and buildings themselves were designed differently.

The important improvement came from redesigning the system around what the technology made possible.

AI assistants are our big electric motor making the existing process better.

## The man with the red flag

In 1865, Britain passed a law requiring every road locomotive to have one person walking in front of the vehicle carrying a red flag.

These were large, heavy and noisy steam-powered machines travelling on roads built for horses and carts.

They had invented a machine that no longer needed a horse, then designed a system in which its progress was still constrained by a man walking in front of it.

A lot of current human-in-the-loop design looks like a digital version of the same thing.

## The product changed. The business didn’t.

In 1886, William Durant was running tiny horse-cart business.

He was good enough at it that within 15 years, his company had become the largest manufacturer in the United States.

Then automobiles started appearing. Unsurprisingly, he didn't like them.

But in 1904, he was asked to take over Buick. He drove one around for a month, became convinced and accepted the offer.

By 1908, Buick had become the highest-volume automobile producer in the United States. He also founded General Motors.

The technology had changed completely but the problem he was solving was the same.

Durant’s skills weren't about horse-cart but knowing how to build an organisation that can manufacture, distribute and sell vehicles.

## The man who took the machine apart

You might think that Durant was already a wealthy man with a strong set of reusable skills.

So let’s talk about George Stephenson.

He started at the bottom of the coal industry.

At some point, he became responsible for operating machinery. The interesting thing about George is that he didn't just operate the engine. He decided to take it apart.

He dismantled it, studied the pieces and put it back together until he understood it well enough that when something went wrong, he knew how to fix it.

Eventually, he could repair engines that others could not and a few years later, he built his first locomotive.

He treated the machine producing those tasks as something he could understand, alter and eventually rebuild.

## Build and understand systems

Okay, so how do we remain economically valuable?

There is pattern in these stories.

Every time a new technology was introduced, the people who did particularly well didn't use it to do the work better. They spent time to understand it and used their skills to build systems around it.

When machines can produce more work than anyone, production is no longer a scarce resource.

Someone still has to decide what should to be done and evaluate if the results are good. Then find where it is failing and why. You need decades to build those skills.

The important distinction, at least for now, is between doing the work and designing the thing that does the work.

We can already see this happening.

We take processes designed around humans doing the work, replace one step with a machine, then carefully preserve everything around it.

Whenever you are the "human in the loop", ask yourself if it is really necessary or if you are just the man holding the red flag.

The practical move is not to use AI to perform your current step faster but to automate it. There are now plenty of things that were not worth doing because it was just too much work.

Take something you do repeatedly and ask what would have to exist for you not to do it at all.
Build a system and watch where it breaks. Do not just fix the mistake. Fix the system itself.

The goal is not to do the same work faster forever but to keep removing the reasons the work needs your attention in the first place.

This does not guarantee that the machine will eventually do your job. Technology will keep improving and humans will constantly have to adapt to it.

## Find the bottleneck

I do not know what this looks like for you. That is something you will have to figure out.
Personally, I am betting on evals.

We have already become pretty good at building systems that produce work.
The harder problem is building systems that can tell whether that work is actually good.

If we can reliably evaluate the output, we can reject failures, find recurring weaknesses and feed those results back into the system.

But I'm sure that, one day, much of it will also be automated.

The only durable skill is learning to identify a bottleneck and turning it into something the new system can use.

But that is my bet.

Yours might be completely different. Just don't become better at carrying the red flag or replace your steam engine with an electric one.

## Where to start

Here are a few questions I think are useful:

- What am I using AI to make faster that I should instead be trying to eliminate?
- What context or rules do I repeatedly have to supply by hand?
- What information do I keep having to find?
- What mistakes do I repeatedly catch and correct?
- What would need to change so that those mistakes could not happen again?
- What would the system need to finish the job itself?
- If I removed myself from this workflow tomorrow, where would it break first?

A few examples make this easier to see.

### Developer

You keep reviewing pull requests for the same problems.

Do not make faster review the goal. That is a small and temporary improvement.

Build those checks into the system instead.

Design an environment in which bad code is less likely to survive. Build the abstractions, generators and workflows that can produce and verify for you.

By the time a pull request reaches you, the obvious problems should already be gone.

Your attention should be reserved for the things that are actually difficult to automate, such as whether the approach makes sense and whether the trade-offs are right.

### Data analyst

Someone asks a question. You find the right tables, write SQL, make a chart, explain what happened, then answer three follow-up questions.

Do not just generate the SQL faster.

Build a system that understands the company’s metrics, knows where the data lives, can investigate anomalies and produces an explanation with enough evidence that people can interrogate it directly.

Your value moves away from repeatedly extracting the answer and towards designing the system that can find trustworthy answers.

### Product designer

You repeatedly turn product requirements into flows, mockups and variants. Then you fix the same inconsistencies: wrong spacing, inaccessible colours, strange interaction states and components used incorrectly.

Do not just use AI to generate Figma screens faster.

Encode those decisions into the design system and the tools that generate the interface.

Build a system that starts from the product constraints, generates candidate flows, checks them against the design system, applies known usability heuristics, incorporates behavioural data and surfaces only the genuinely difficult trade-offs to you.

Fix the system that produces the screens.

### Engineering manager

You spend hours asking for status, identifying blockers, checking whether projects are slipping and reminding people about dependencies.

Do not use AI to write prettier status summaries.

Build a system that watches the actual work, detects deviations, asks for missing context and only involves you when a decision or intervention is required.

That system will not resolve conflict, coach someone through a difficult situation or decide which trade-off the organisation should make.

It will stop wasting your attention on collecting facts the software already knows.

### QA engineer

You repeatedly test the same flows after every release.

Do not have AI click through the same test plan faster.

Build a system that understands the product’s invariants, generates tests from changes, explores unexpected states and turns every production bug into a regression test.

The goal is not a faster human-shaped testing process.

The goal is a product that continuously tries to prove itself wrong.

### Product manager

You collect feedback from support, sales, analytics and interviews, then try to work out what matters.

Do not use AI merely to summarise the feedback.

Build a system that continuously clusters problems, connects them to behaviour and revenue, detects changes in frequency and gives you the few decisions actually worth spending human attention on.
