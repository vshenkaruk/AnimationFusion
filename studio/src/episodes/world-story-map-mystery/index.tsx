import React from 'react';
import { defineStoryWorldEpisode, WorldTimeline } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14 } from './shots';

export const worldStoryMapMystery = defineStoryWorldEpisode('WorldStoryMapMystery', timeline as unknown as WorldTimeline, {
  S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14,
});
