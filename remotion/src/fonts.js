import { loadFont as loadNotoSansJP }   from '@remotion/google-fonts/NotoSansJP';
import { loadFont as loadMPlus1p }      from '@remotion/google-fonts/MPLUS1p';
import { loadFont as loadNotoSerifJP }  from '@remotion/google-fonts/NotoSerifJP';

// NotoSansJP は数百個の unicode range サブセットに分割されているため
// subsets を指定せず全ウェイトをロードする（サブセット指定だと 'japanese' キーが解決できない）
export const { fontFamily: fontPrimary } = loadNotoSansJP('normal', {
  weights: ['400', '700', '900'],
});

export const { fontFamily: fontSecondary } = loadMPlus1p('normal', {
  weights: ['400', '700', '900'],
});

export const { fontFamily: fontSerif } = loadNotoSerifJP('normal', {
  weights: ['400', '700'],
});
