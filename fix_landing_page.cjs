const fs = require('fs');
let content = fs.readFileSync('c:/Users/FHY/Documents/Seedance2/src/pages/LandingPage.vue', 'utf8');

const r = (t, r) => {
    if(!content.includes(t)) console.log('WARNING: target not found:\n' + t.substring(0, 50));
    content = content.replace(t, r);
};

r(`            <h2 class="editorial-title">鎶婁竴鍙ョ伒鎰燂紝鐩存帴缈昏瘧鎴愬彲鎵ц鐨勯暅澶磋鍒掋€?/h2>
            <p class="editorial-desc">
              SeedancePrompt 涓嶅彧鏄鼎鑹叉枃瀛楋紝鑰屾槸鎶婇鏍笺€侀暅澶淬€佸姩浣溿€佽妭濂忎笌鎯呯华鎷嗘垚鍙惤鍦扮殑鎷嶆憚璇█锛屽府鍔╀釜浜轰笌鍥㈤槦蹇€熻繘鍏ュ垱浣滅姸鎬併€?            </p>
            <div class="editorial-points">
              <p>杈撳叆妯＄硦鎯虫硶锛岃嚜鍔ㄨˉ榻愰暅澶寸粨鏋勪笌鍙欎簨鑺傚銆?/p>
              <p>杈撳嚭鍙洿鎺ュ鐢ㄥ埌鐢熸垚宸ュ叿涓庡垎闀滃崗浣沧祦绋嬨€?/p>
              <p>鍑忓皯鍙嶅璇曢敊锛岃绗竴鐗堢粨鏋滄洿鎺ヨ繎鐩爣鐢婚潰銆?/p>
            </div>`, `            <h2 class="editorial-title">把一句灵感，直接翻译成可执行的镜头计划。</h2>
            <p class="editorial-desc">
              SeedancePrompt 不只是润色文字，而是把风格、镜头、动作、节奏与情绪拆成可落地的拍摄语言，帮助个人与团队快速进入创作状态。
            </p>
            <div class="editorial-points">
              <p>输入模糊想法，自动补齐镜头结构与叙事节奏。</p>
              <p>输出可直接复用到生成工具与分镜协作流程。</p>
              <p>减少反复试错，让第一版结果更接近目标画面。</p>
            </div>`);

r(`          <h2 class="editorial-title">鎶婁竴鍙ョ伒鎰燂紝鐩存帴缈昏瘧鎴愬彲鎵ц鐨勯暅澶磋鍒掋€?/h2>
          <p class="editorial-desc">
            SeedancePrompt 涓嶆鏄鼎鑹叉枃鏈紝鑰屾槸鎶婇鏍笺€侀暅澶淬€佸姩浣溿€佽妭濂忎笌鎯呯华鎷嗘垚鍙惤鍦扮殑鎷嶆憚璇█锛屽府鍔╀釜浜轰笌鍥㈤槦蹇€熻繘鍏ュ垱浣滅姸鎬併€?          </p>
          <div class="editorial-points">
            <p>杈撳叆妯＄硦鎯虫硶锛岃嚜鍔ㄨˉ榻愰暅澶寸粨鏋勪笌鍙欎簨鑺傚銆?/p>
            <p>杈撳嚭鍙洿鎺ュ鐢ㄥ埌鐢熸垚宸ュ叿涓庡垎闀滃崗浣沧祦绋嬨€?/p>
            <p>鍑忓皯鍙嶅璇曢敊锛岃绗竴鐗堢粨鏋滄洿鎺ヨ繎鐩爣鐢婚潰銆?/p>
          </div>`, `          <h2 class="editorial-title">把一句灵感，直接翻译成可执行的镜头计划。</h2>
          <p class="editorial-desc">
            SeedancePrompt 不止是润色文本，而是把风格、镜头、动作、节奏与情绪拆成可落地的拍摄语言，帮助个人与团队快速进入创作状态。
          </p>
          <div class="editorial-points">
            <p>输入模糊想法，自动补齐镜头结构与叙事节奏。</p>
            <p>输出可直接复用到生成工具与分镜协作流程。</p>
            <p>减少反复试错，让第一版结果更接近目标画面。</p>
          </div>`);

r(`                  <p>鐐瑰嚮鎾斁瀹屾暣鐗?/p>
                  <h3>浜у搧婕旂ず绐楀彛锛屾敮鎸佷竴閿叏灞忚鐪?/h3>
                  <span>鐐瑰嚮璇ュ尯鍩熷嵆鍙墦寮€瀹屾暣瑙嗛锛屾煡鐪嬪畬鏁翠氦浜掓祦绋嬩笌缁撴灉灞曠ず銆?/span>
                </div>
                <p>鐐瑰嚮鎾斁瀹屾暣鐗?/p>
                <h3>浜у搧婕旂ず绐楀彛锛屾敮鎸佷竴閿叏灞忚鐪?/h3>
                <span>鐐瑰嚮姝ゅ尯鍩熷嵆鍙墦寮€瀹屾暣瑙嗛锛屾煡鐪嬪畬鏁翠氦浜掓祦绋嬩笌缁撴灉灞曠ず銆?/span>`, `                  <p>点击播放完整版</p>
                  <h3>产品演示窗口，支持一键全屏观看</h3>
                  <span>点击该区域即可打开完整视频，查看完整交互流程与结果展示。</span>
                </div>
                <p>点击播放完整版</p>
                <h3>产品演示窗口，支持一键全屏观看</h3>
                <span>点击此区域即可打开完整视频，查看完整交互流程与结果展示。</span>`);

r(`          <p class="optimized-video-desc">
            杩欓噷鐢ㄤ簬鏀剧疆鈥滀紭鍖栧悗鈥濈殑鏈€缁堟紨绀鸿棰戙€備綘鎶婅棰戞枃浠舵斁鍒?            <code>/public/showcase/optimized-demo.mp4</code> 鍚庯紝杩欓噷浼氳嚜鍔ㄦ挱鏀惧苟鍙叏灞忔煡鐪嬨€?          </p>
        </div>
          <p class="detail-showcase-desc">杩欓噷鐢ㄤ簬灞曠ず鍙傛暟闈㈡澘涓庢渚嬪崱鐗囩粏鑺傦紝鏂逛究鐢ㄦ埛蹇€熺悊瑙ｇ晫闈㈣兘鍔涖€?/p>
        </div>
        <div class="detail-showcase-grid">
          <article class="detail-card detail-card-small">
            <img
              class="detail-media"
              :src="detailShowcaseImages.duration"
              alt="鏃堕暱閫夐」灞曠ず"
              @error="handleDetailImageError"
            />
            <div class="detail-caption">
              <strong>鏃堕暱閫夐」</strong>
              <span>鐭墖 / 涓瓑 / 闀跨墖 / 瓒呴暱 / 鑷畾涔?/span>
            </div>
          </article>
          <article class="detail-card detail-card-small">
            <img
              class="detail-media"
              :src="detailShowcaseImages.scene"
              alt="鍦烘櫙绫诲瀷灞曠ず"
              @error="handleDetailImageError"
            />
            <div class="detail-caption">
              <strong>鍦烘櫙绫诲瀷</strong>
              <span>鑷姩璇嗗埆 / 鐢靛晢骞垮憡 / 浠欎緺濂囧够 / 鐭墽瀵圭櫧 / 绉戞櫘鏁欏</span>
            </div>
          </article>
          <article class="detail-card detail-card-wide">
            <img
              class="detail-media"
              :src="detailShowcaseImages.gallery"
              alt="妗堜緥鍗＄墖灞曠ず"
              @error="handleDetailImageError"
            />
            <div class="detail-caption">
              <strong>妗堜緥鍗＄墖</strong>
              <span>灏侀封面銆佹枃妗堛€佹爣绛俱€佷綔鑰呬笌鏉ユ簮淇℃伅涓€浣撳睍绀?/span>
            </div>`, `      </section>

      <section class="detail-showcase reveal-section" :ref="registerReveal">
        <div class="detail-showcase-head">
          <p class="detail-showcase-kicker">Detail Views</p>
          <h3 class="detail-showcase-title">页面详情展示</h3>
          <p class="detail-showcase-desc">这里用于展示参数面板与案例卡片细节，方便用户快速理解界面能力。</p>
        </div>
        <div class="detail-showcase-grid">
          <article class="detail-card detail-card-small">
            <img
              class="detail-media"
              :src="detailShowcaseImages.duration"
              alt="时长选项展示"
              @error="handleDetailImageError"
            />
            <div class="detail-caption">
              <strong>时长选项</strong>
              <span>短片 / 中等 / 长片 / 超长 / 自定义</span>
            </div>
          </article>
          <article class="detail-card detail-card-small">
            <img
              class="detail-media"
              :src="detailShowcaseImages.scene"
              alt="场景类型展示"
              @error="handleDetailImageError"
            />
            <div class="detail-caption">
              <strong>场景类型</strong>
              <span>自动识别 / 电商广告 / 仙侠奇幻 / 短剧对白 / 科普教学</span>
            </div>
          </article>
          <article class="detail-card detail-card-wide">
            <img
              class="detail-media"
              :src="detailShowcaseImages.gallery"
              alt="案例卡片展示"
              @error="handleDetailImageError"
            />
            <div class="detail-caption">
              <strong>案例卡片</strong>
              <span>封面、文案、标签、作者与来源信息一体展示</span>
            </div>`);

fs.writeFileSync('c:/Users/FHY/Documents/Seedance2/src/pages/LandingPage.vue', content);
console.log('done replacing');
