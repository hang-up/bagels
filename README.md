# Hana

Hana is a tool that lets you record a conversation with a loved one and turns it into a beautiful, shareable digital experience in their words and in their language.

## Inspiration
We realized there's no tool that captures histories from family elders before it's too late. Reddit is full of people grieving recipes and stories their grandmothers never wrote down. We were inspired to build a tool that maintains the culturally relevance of where our loved ones come from, and preserving their stories in beautiful digital modes. 

## What it does
Hana lets you record a conversation with a family elder and transforms it into an interactive, shareable digital form. 
AI captures voice, transcribes it, and structures it into a storyline centered around "beats". A beat is a single moment in the story, usually visual in nature, such as a food memory, a recipe, an action scene, or a family-bond. 
Then, based on a heritage pack (a curated cultural aesthetic), a digital renders with matched typography, palette, and illustrations. 

## How we built it
Hana is meant to be a proof of concept for a larger project. For this hackathon, we assumed an onboarding flow, where the user would already have selected a family member and a heritage pack.
The transformation from voice to structured data is handled by an n8n workflow, built with the following steps:
- transcribe audio (OpenAI whisper)
- extract facts from transcript
- structure story beats
- generate visual content per beat/per heritage pack
- persist story to database
- render story to frontend using https://github.com/chenglou/pretext

## Challenges we ran into
- Performance limitations with media to text animation
  - We wanted beats to feel more cinematic—recipes unfolding, motion, family moments—but the memory-card animation approximates a “scene” by sampling dark pixels from stills or GIFs onto a coarse grid and reusing the beat’s own text as particles (with caps and GIF frame subsampling), not by converting each video frame to ASCII. The result reads well as atmosphere, but fine detail, long clips, and clear likeness didn't hold up.
- Voice capture accuracy (multi language)
  - We only supported English and Filipino for this demo, as our default heritage packs. Voice capture accuracy was not a priority.

## What's next for Hana
- Heritage packs and marketplaces so communities can create their own cultural asset libraries.
- Print-on-demand so digital artifacts can become physical zines.
- Institutional licenses for libraries and elder care facilities: The story becomes a world you can visit.
- Expanding on the voice layer to also integrate in ElevenLabs for storytelling in our loved ones’ language of origin.
