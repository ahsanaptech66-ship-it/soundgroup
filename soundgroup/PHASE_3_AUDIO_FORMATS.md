# SOUNDGROUP Phase 3 — Audio Format Support

Supported/common audio extensions now accepted by the admin picker, drag/drop filter, and PHP media-type classification:

- MP3 (`.mp3`)
- MPEG audio (`.mp2`, `.mpa`, `.mpga`, audio `.mpeg`)
- WAV (`.wav`, `.wave`)
- FLAC (`.flac`)
- MPEG-4 audio (`.m4a`, `.m4b`)
- AAC (`.aac`, `.adts`)
- OGG Vorbis / Ogg audio (`.ogg`, `.oga`)
- Opus (`.opus`)
- AIFF (`.aiff`, `.aif`, `.aifc`)
- Windows Media Audio (`.wma`)
- AMR (`.amr`, `.awb`)
- Core Audio / AU / SND (`.caf`, `.au`, `.snd`)

Important distinction: upload/storage support is broader than browser playback support. Some legacy or less-common formats (notably WMA/AMR/AIFF in some browsers) may upload successfully but may not play natively in every browser. The file remains stored correctly in the audio library; playback depends on the browser codec stack.

MPEG with MIME `video/mpeg` is a video container and is intentionally not forced into the music pipeline; it belongs to Phase 4 Video Management. Audio MPEG detected as `audio/mpeg` is accepted as music.

## MPEG audio fix

Admin Music Management now accepts MPEG-family audio extensions including .mp1, .mp2, .mp3, .mpa, .mpga, .mpeg and .mpg. When PHP/fileinfo reports an ambiguous MPEG MIME such as video/mpeg for one of these extensions, the Music upload endpoint treats the file as audio. Clearly non-MPEG video types remain classified as video.
