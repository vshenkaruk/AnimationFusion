import React from 'react';
import { defineStoryWorldEpisode, WorldTimeline } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S4B, S5, S5B, S5C, S6, S6B, S7, S8, S9, S10, S11, S11B, S12, S13, S14, S15 } from './shots';

export const worldStoryScaleScroll = defineStoryWorldEpisode('WorldStoryScaleScroll', timeline as unknown as WorldTimeline, {
  S1, S2, S3, S4, S4B, S5, S5B, S5C, S6, S6B, S7, S8, S9, S10, S11, S11B, S12, S13, S14, S15,
});
