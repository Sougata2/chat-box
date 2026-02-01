import { useCallback, useContext, useEffect, useState } from "react";
import { MediaContext } from "@/app/contexts";
import { AppDispatch } from "@/app/store/store";
import { useDispatch } from "react-redux";
import { PageLocator } from "@/app/types/page";
import { FaXmark } from "react-icons/fa6";
import { popPage } from "@/app/store/pageSlice";
import Image from "next/image";

type imageDimension = { width: number; height: number };

function MediaUpload() {
  const dispatch = useDispatch<AppDispatch>();
  const mediaFiles = useContext(MediaContext);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [dimensions, setDimension] = useState<Record<string, imageDimension>>(
    {},
  );

  const makeMediaUrls = useCallback(() => {
    if (!mediaFiles) return [];
    setMediaUrls(Array.from(mediaFiles).map((m) => URL.createObjectURL(m)));
  }, [mediaFiles]);

  useEffect(() => {
    (() => {
      makeMediaUrls();
    })();
  }, [makeMediaUrls]);

  return (
    <div
      className="
        p-4
        bg-white
        border rounded-2xl border-slate-300
      "
    >
      <div
        onClick={() => {
          dispatch(popPage({ stack: "media" } as PageLocator));
        }}
        className="
          w-fit
          p-1
          rounded-full
          hover:bg-slate-100
        "
      >
        <FaXmark size={18} />
      </div>
      <div
        className="
          flex
          justify-center items-center
        "
      >
        <div
          className="
            flex
            w-full
            justify-center items-center
          "
        >
          {mediaUrls.map((url) => {
            const dim = dimensions[url];
            return (
              <div
                key={url}
                style={
                  dim
                    ? { aspectRatio: `${dim.width} / ${dim.height}` }
                    : undefined
                }
              >
                <Image
                  alt="Media"
                  src={url}
                  width={dim?.width ?? 200}
                  height={dim?.height ?? 200}
                  className="max-h-80 h-auto w-full rounded-md object-contain border border-slate-200 shadow-md"
                  onLoadingComplete={(img) => {
                    setDimension((prev) => ({
                      ...prev,
                      [url]: {
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      } as imageDimension,
                    }));
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MediaUpload;
