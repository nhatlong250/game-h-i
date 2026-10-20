import { Chapter } from './types';

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'Chương 1',
    subtitle: 'Ngày Đầu Tiên Ở Căn Bếp',
    lore: 'Duyên bước vào ca làm đầu tiên sau khi nộp đề cương khóa luận. Chú Ba hướng dẫn kỹ thuật chiên trứng vàng giòn và kẹp bánh mì pa-tê chuẩn vị.',
    targetScore: 200,
    shiftDuration: 120,
    availableRecipeIds: ['banh_mi_op_la'],
    introDialogues: [
      {
        id: 'c1_intro_1',
        speaker: 'Duyên',
        role: 'Sinh viên 21 tuổi · Google Ambassador',
        text: 'Hôm nay là buổi làm đầu tiên của mình ở Căn Bếp Khởi Đầu. Tốt nghiệp chỉ còn 2 tháng nữa, vừa làm luận văn vừa làm đại sứ công nghệ, nhưng mình muốn tự lập!',
        next: 'c1_intro_2',
      },
      {
        id: 'c1_intro_2',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm kiêm Bếp trưởng',
        text: 'Chào con gái! Bếp này không cần vội vàng đâu con. Bí quyết là trứng chiên phải nghe rõ tiếng xèo xèo, viền vàng rụm mà lòng đào vẫn sánh dẻo. Con nắm rõ công thức Bánh Mì Ốp La chưa?',
        choices: [
          {
            text: 'Dạ con đã ghi nhớ kỹ trong sổ tay rồi chú! Bánh mì + pa-tê + trứng ốp la + dưa leo + tương ớt.',
            nextNodeId: 'c1_choice_1',
            impactDescription: 'Tăng tự tin: Thời gian kiên nhẫn của khách +5s',
          },
          {
            text: 'Dạ con hơi run một xíu, nhưng con sẽ làm thật tập trung và cẩn thận từng đĩa!',
            nextNodeId: 'c1_choice_2',
            impactDescription: 'Cẩn trọng: Tăng 10% tiền tip từ khách',
          },
        ],
      },
      {
        id: 'c1_choice_1',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Rất sáng dạ! Lấy nguyên liệu, thái dưa leo trên thớt, chiên trứng chín tới rồi bày ra đĩa giao cho khách nhé. Chuông sảnh reo là vào việc thôi!',
        next: 'c1_ready',
      },
      {
        id: 'c1_choice_2',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Người cẩn thận thì làm món gì cũng ngon. Cứ bình tĩnh thao tác, chú tin con làm được!',
        next: 'c1_ready',
      },
      {
        id: 'c1_ready',
        speaker: 'Duyên',
        role: 'Tự nhủ',
        text: 'Hít thở thật sâu nào. Bắt đầu ca một với tất cả sự nhiệt huyết!',
      },
    ],
    outroDialogues: [
      {
        id: 'c1_outro_1',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Tuyệt vời lắm Duyên! Mấy ổ bánh mì giòn tan, trứng thơm lừng của con khiến khách tấm tắc khen mãi đấy.',
        next: 'c1_outro_2',
      },
      {
        id: 'c1_outro_2',
        speaker: 'Duyên',
        role: 'Duyên',
        text: 'Dạ con cảm ơn chú Ba! Đôi tay quen dần với nhịp thớt và bếp lửa rồi ạ. Con cảm thấy tự tin hơn rất nhiều.',
        choices: [
          {
            text: 'Con về trường thư viện hoàn thiện slide đề cương khóa luận tiếp đây chú!',
            nextNodeId: 'c1_end_study',
            impactDescription: 'Mở khóa Chương 2: Cân Bằng Khóa Luận',
          },
          {
            text: 'Con dọn rửa căn bếp sạch sẽ rồi mới về nghỉ ngơi ạ.',
            nextNodeId: 'c1_end_neat',
            impactDescription: 'Nhận huy hiệu: Bếp Sạch Vệ Sinh',
          },
        ],
      },
      {
        id: 'c1_end_study',
        speaker: 'Duyên',
        role: 'Nhật ký',
        text: 'Một ngày khởi đầu trọn vẹn. Hương thơm bánh mì và tiếng reo chuông bếp như tiếp thêm động lực cho con đường phía trước.',
      },
      {
        id: 'c1_end_neat',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Con gái chu đáo quá! Nghỉ ngơi thật tốt để chuẩn bị cho ca trưa mai nhé.',
      },
    ],
  },
  {
    id: 2,
    title: 'Chương 2',
    subtitle: 'Cân Bằng Giữa Khóa Luận & Bếp Nóng',
    lore: 'Ca làm trưa cao điểm khi dân văn phòng và sinh viên đổ về. Duyên phải thực hiện món Cơm Chiên Trứng Lạp Xưởng đòi hỏi kỹ thuật đảo chảo nhanh và thái hành hoa.',
    targetScore: 320,
    shiftDuration: 150,
    availableRecipeIds: ['banh_mi_op_la', 'com_chien_duong_chau'],
    introDialogues: [
      {
        id: 'c2_intro_1',
        speaker: 'Duyên',
        role: 'Duyên',
        text: 'Vừa gửi email bài nộp khóa luận cho giáo sư lúc 11 giờ, mình chạy ngay qua quán. Trưa nay quán rất đông!',
        next: 'c2_intro_2',
      },
      {
        id: 'c2_intro_2',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Duyên ơi, khách bắt đầu gọi Cơm Chiên Trứng Lạp Xưởng rồi đấy! Nhớ lấy cơm nóng trong nồi, xào trứng vàng thơm, thái lạp xưởng và hành hoa trên thớt, thêm xì dầu nữa nhé!',
        choices: [
          {
            text: 'Dạ con sẵn sàng chia việc hai tay: một bên canh chảo, một bên thái nguyên liệu!',
            nextNodeId: 'c2_choice_1',
            impactDescription: 'Tốc độ nấu xào tăng 15%',
          },
          {
            text: 'Dạ con sẽ chú ý không để lửa quá to làm cháy trứng hay cơm.',
            nextNodeId: 'c2_choice_2',
            impactDescription: 'Giảm nguy cơ cháy đồ ăn',
          },
        ],
      },
      {
        id: 'c2_choice_1',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Đúng tác phong đại sứ công nghệ: đa nhiệm nhưng cực kỳ khoa học! Bắt đầu ca trưa nào con!',
      },
      {
        id: 'c2_choice_2',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Biết canh lửa là tố chất của đầu bếp cừ khôi đấy. Chúc con một ca làm thành công!',
      },
    ],
    outroDialogues: [
      {
        id: 'c2_outro_1',
        speaker: 'Duyên',
        role: 'Duyên',
        text: 'Phù... ca trưa đã vãn khách rồi! Từng đĩa cơm chiên óng vàng bốc khói nghi ngút được giao đúng giờ. Vừa mệt vừa vui lạ kỳ!',
        next: 'c2_outro_2',
      },
      {
        id: 'c2_outro_2',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Khách bàn số 2 khen cơm chiên của Duyên thơm nức và lạp xưởng đậm đà lắm. Giáo sư cũng vừa phản hồi khen bài khóa luận của con kìa!',
        next: 'c2_end',
      },
      {
        id: 'c2_end',
        speaker: 'Duyên',
        role: 'Nhật ký',
        text: 'Khi ta toàn tâm toàn ý vào từng việc nhỏ, áp lực bỗng biến thành sức mạnh diệu kỳ.',
      },
    ],
  },
  {
    id: 3,
    title: 'Chương 3',
    subtitle: 'Sự Kiện Google Ambassador & Bữa Tiệc Sinh Viên',
    lore: 'Duyên tổ chức buổi workshop hướng dẫn sinh viên ứng dụng công nghệ Google. Sau sự kiện, nhóm sinh viên ghé quán thưởng thức thực đơn phối hợp phong phú.',
    targetScore: 420,
    shiftDuration: 180,
    availableRecipeIds: ['banh_mi_op_la', 'com_chien_duong_chau', 'dia_op_la_xuc_xich', 'banh_mi_thap_cam'],
    introDialogues: [
      {
        id: 'c3_intro_1',
        speaker: 'Duyên',
        role: 'Google Ambassador',
        text: 'Workshop công nghệ hôm nay thành công rực rỡ! Các bạn sinh viên trong ban tổ chức bảo muốn ghé quán nếm thử tài nấu ăn của mình!',
        next: 'c3_intro_2',
      },
      {
        id: 'c3_intro_2',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Haha, Chú Ba đã chuẩn bị sẵn lạp xưởng, trứng tươi và bánh mì thơm nức rồi. Ca này con sẽ phục vụ cả 3 món trong thực đơn. Hãy thể hiện bản lĩnh nhé!',
        choices: [
          {
            text: 'Con sẽ phục vụ các bạn những phần ăn ngon và đẹp mắt nhất!',
            nextNodeId: 'c3_choice_1',
            impactDescription: 'Điểm thưởng món ăn +20%',
          },
          {
            text: 'Con cảm ơn chú Ba đã tạo cơ hội cho con gắn kết bạn bè tại quán ạ.',
            nextNodeId: 'c3_choice_2',
            impactDescription: 'Mở rộng uy tín của quán',
          },
        ],
      },
      {
        id: 'c3_choice_1',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Đẹp mắt và ngon miệng, đó là linh hồn của ẩm thực Việt. Vào vị trí nào Duyên!',
      },
      {
        id: 'c3_choice_2',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Quán này là nhà của con mà. Cùng nhau đem lại niềm vui cho các bạn trẻ nhé!',
      },
    ],
    outroDialogues: [
      {
        id: 'c3_outro_1',
        speaker: 'Sinh viên Hùng',
        role: 'Khách quen · Bạn học',
        text: 'Duyên ơi, bánh mì ốp la và cơm chiên ngon xuất sắc luôn! Vừa thuyết trình công nghệ hay lại nấu ăn đỉnh thế này!',
        next: 'c3_outro_2',
      },
      {
        id: 'c3_outro_2',
        speaker: 'Duyên',
        role: 'Duyên',
        text: 'Cảm ơn mọi người nhiều lắm! Được thấy nụ cười của các bạn sau giờ học căng thẳng là hạnh phúc lớn nhất của mình.',
      },
    ],
  },
  {
    id: 4,
    title: 'Chương 4',
    subtitle: 'Đêm Tốt Nghiệp & Hương Vị Khởi Đầu',
    lore: 'Đêm mừng tốt nghiệp đại học loại Xuất sắc của Duyên. Khách quen, thầy cô và gia đình quây quần tại quán trong ca làm kỷ niệm đầy tự hào.',
    targetScore: 500,
    shiftDuration: 200,
    availableRecipeIds: ['banh_mi_op_la', 'com_chien_duong_chau', 'dia_op_la_xuc_xich', 'banh_mi_thap_cam', 'com_chien_dac_biet'],
    introDialogues: [
      {
        id: 'c4_intro_1',
        speaker: 'Duyên',
        role: 'Tân Cử Nhân · Google Ambassador',
        text: 'Tấm bằng đại học đã cầm trên tay, dự án cộng đồng hoàn thành xuất sắc. Nhưng tối nay, mình muốn đứng ở căn bếp này để phục vụ những người mình trân quý nhất.',
        next: 'c4_intro_2',
      },
      {
        id: 'c4_intro_2',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Chú Ba tự hào về con lắm Duyên à! Từ cô bé bỡ ngỡ cầm dao ngày đầu, giờ con đã là một đầu bếp tự tin, một đại sứ trưởng thành. Hãy làm nên ca nấu thăng hoa nhất nào!',
      },
    ],
    outroDialogues: [
      {
        id: 'c4_outro_1',
        speaker: 'Chú Ba',
        role: 'Chủ tiệm',
        text: 'Chúc mừng Duyên! Dù sau này con bay cao bay xa trong sự nghiệp công nghệ, căn bếp này mãi mãi là ngôi nhà chở che và chào đón con.',
        next: 'c4_outro_2',
      },
      {
        id: 'c4_outro_2',
        speaker: 'Duyên',
        role: 'Duyên',
        text: 'Con cảm ơn chú Ba, cảm ơn tất cả những bài học quý giá từ căn bếp khởi đầu này. Duyên đã sẵn sàng bước vào chặng đường đời rực rỡ phía trước!',
      },
    ],
  },
];
