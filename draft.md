# You don’t need to move faster. You just need to do less.

I set up this blog to write down some of my thoughts and maybe find a few people on the internet interested enough to read them.

I didn't plan anything. I put together a few HTML pages and published it in about 10 seconds.

I've improved a few things since, but it's still basically a bunch of static files I can serve from anywhere. Because I never expected much traffic, I was missing some obvious things: analytics, a newsletter, even an RSS feed.

Then one of my posts took off on Hacker News. I added analytics too late and, worst of all, only set up the newsletter after most of the traffic had already happened. I probably missed out on hundreds of subscribers.

## "You should definitely have set all of that up before."

Well, no.

The truth is I've started a lot of projects and most of them went nowhere. My GitHub is basically a graveyard with hundreds of abandoned repositories.

On my first projects, I spent the time setting everything up properly: analytics, infrastructure, all the little things I'd obviously need once the project became successful.

I have now learned that my time is usually better spent somewhere else. New projects have a low chance of success by nature, so build the thing, put it out there, see if anyone bites and only then [draw the rest of the owl](https://knowyourmeme.com/memes/how-to-draw-an-owl).

## "Ok, but still... you missed out on a huge opportunity."

Yes. But it doesn't matter.

For this blog to be successful, I'm going to have to consistently write high-quality posts that people want to read. One popular article isn't enough.

If I can keep writing things people want to read, I'll have plenty more opportunities to build an audience and collect analytics. And if I can't, then I only managed to write one good article, people will unsubscribe and none of this mattered anyway.

That same logic applies to software in general. If people actually want what you’re building, you’ll have plenty of opportunities to add everything you skipped.

## Solving problems you don't have

If you've made it this far, you're probably expecting me to say something like "just use Postgres".

And yes, it's true. Over and over I see companies wasting resources on things they don't need, for users they don't have. What do you mean you're working on the database migration? You don't have any users. Just nuke the db already and start fresh! Kubernetes/ECS/Serverless? Why?

Not only are you wasting time, you're also making the product harder to build. And you'll probably get the scaling wrong anyway because scaling is hard. Until you're actually hitting the limits, you're mostly guessing what could go wrong.

I've talked enough about the tech stack in the boring engineer piece. Today, I want to talk about processes.

## Half the stuff you think you need is just making work harder

There are things you could just stop doing and things would move faster. Ways of working that have become habits without anyone asking whether they’re still useful.

Most of this stuff is easier than ever to add with AI. A few prompts and you can have CI, dashboards, staging, ticketing, backups. Pretty much whatever you want. However, once it exists, you, the human, have to maintain it. AI can help with this too but the responsibility ultimately stays on you.

But before we get into the tech, let’s talk about the things so ingrained in our way of working that we barely question them anymore.

### Scheduled communication

It’s 9:07am.

You’ve got coffee. Slack is still quiet. Your brain is fresh. You open the codebase and finally understand the thing that made absolutely no sense yesterday.

“Oh. That’s why it’s breaking.”

You start typing.

9:20. DING!

```text
Standup in 10 minutes.
```

“Well... maybe I can finish this before—”

Nope.

9:30.

- “Morning.”
- “Morning.”
- “Can you hear me?”
- “Yeah.”
- “Cool. Who wants to go first?”

The daily ritual of telling people things they already know begins.

- “Yesterday I worked on X. Today I’m continuing with X. No blockers.”
- “Yesterday I worked on Y. Today I’m starting Z. No blockers.”

You already knew this because... you work with these people. You talk all day. You can see their pull requests.

If something important happened, nobody would patiently save it for tomorrow morning.

- “Hey, production is completely broken.”
- “Should we tell Sarah?”
- “Nah. Let’s save it for standup.”

Obviously not.

Fifteen minutes later:

“Thanks everyone!”

You go back to your computer.

“Wait… where was I?”

The entire architecture your brain had in L1 cache has been garbage collected.

At lunch, you grab a burrito with a couple of teammates and spend twenty minutes talking through the next feature. You walk back with three ideas worth testing but you won't have time to test any of them because...

14:00.

- “So how many story points is this?”
- “I don’t know.”
- “If you had to guess?”
- “We’re building something nobody has built before, for users we’re still learning about, on a product that changes every three days.”
- “So... five?”
- “Sure.”

Great. “We have no idea” has successfully been converted into a number.

And then, throughout the week, there's retro, sprint planning, backlog grooming. Half the team is half listening while doing something else.

---

I’m not saying teams shouldn’t communicate. Obviously they should. But if you’re a small team, communication shouldn’t require this much ceremony.

If you’re working on something new:

- Nobody can accurately predict how long half this stuff will take.
- Nobody needs a daily recital of what everyone worked on yesterday.
- Nobody joined because they dreamed of moving sticky notes around.

Your advantage is speed and a bunch of smart people working together. When something matters, they talk.

Have them spend as much time as possible on the thing your customers might actually care about: **building the product.** Trust that grown adults can talk to each other when they need to. If a few people can’t, deal with them directly instead of building a process that punishes everyone else.

> Note: if you work at a FAANG company, a bank, or some other huge or heavily regulated organisation, I’m not talking about you. Big companies need structure. Small teams shouldn’t copy them before they need it.

Processes have the same failure mode as technical infrastructure. You add machinery to solve problems you don’t have yet.

## And then there’s the tech

The things you add because everyone else does. It’s been in every project you’ve ever worked on. The stuff people will probably judge you if you don’t have it.

Off the top of my head:

**Observability and centralised logs:** Nobody is using your app. Add a few log lines, SSH into the box, run `docker logs` and move on. You do not need dashboards, traces, metrics pipelines and five different alerts for traffic you do not have.

**Backups:** If you don’t have any data you care about yet, run `pg_dump` occasionally. You do not need automated snapshots, cross-region replication, point-in-time recovery and a disaster recovery plan for a database with three test accounts in it.

**CI:** Run it locally in a pre-commit hook with something like [Dagger](https://dagger.io). My MacBook Pro runs the tests faster than GitHub Actions. For the last few years, it has had better uptime too... If it's just a few trusted people, you don’t need to send every commit to a remote machine just to run the exact same tests you could have run before pushing.

**Staging environment:** It’s another environment to maintain and it still won’t behave exactly like production anyway. If your infrastructure is simple and changes are cheap to roll back, you might not need one yet. Make sure you can restore the production database schema and run the whole system locally. Add staging when production changes become risky enough to justify maintaining another environment.

**Project tracker:** Use something like [Backlog.md](https://backlog.md). Underneath, it’s just Markdown files in git. You get version history and everything stays next to the code. Your agents can read the tasks alongside the code, gather the surrounding context, document what they changed and update the task as part of the same PR. If you have a small team and people need tickets assigned to them just to know what they should be working on, the problem isn’t your lack of a project management software.

## “Sure, you can skip these things now, but you’ll regret it later.”

Maybe. But almost everything I’ve mentioned can easily be added progressively.

Need backups? Start with `pg_dump` from your laptop. Or maybe schedule it on a server and send it to object storage. Add incremental backups and point-in-time recovery. Eventually you might decide managing the database yourself is no longer worth it and move to a provider. At least by then, you actually know what your requirements are.

Start with `docker logs` and centralise them when that becomes painful. Move it to GitHub Actions when you actually need remote CI. Add staging when production changes become risky enough to justify maintaining another environment.

I’m not saying **never** use these things. Just **don’t pay for them before you need them**. And “pay” doesn’t just mean money.

Keeping things simple has another advantage. There are fewer moving parts, fewer failure modes and fewer places to look when something breaks.

When the simple version finally stops working, good. You now have a real problem and you've learned enough from operating it to make an informed choice about what comes next instead of guessing upfront.
